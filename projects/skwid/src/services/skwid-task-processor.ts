import { InjectionTokens, SkwidJob, SkwidJobHandler, SkwidJobHandlerUtils } from '@codewyre/skwid-contracts';
import chalk from 'chalk';
import { injectable, multiInject, optional } from 'inversify';
import { NodeVM } from 'vm2';
import fs from 'fs';
import path from 'path';

import { SkwidTask } from '../models/configuration/skwid-task';
import { Context } from '../models/context';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { getHashes } from 'node:crypto';
import fg from 'fast-glob';

type FileState = Record<string, string>;

@injectable()
export class SkwidTaskProcessor {

  //#region Ctor
  public constructor(
    @optional()
    @multiInject(InjectionTokens.SkwidJobHandler)
    private readonly _jobHandlers?: Array<SkwidJobHandler<SkwidJob>>) {
  }
  //#endregion

  //#region Public Methods
  public verifyConfiguration(task: SkwidTask): void {
    if (!task.jobs) {
      return;
    }

    if (!this._jobHandlers) {
      throw new Error(`Could not find any job handlers. Exiting.`);
    }

    for (const job of task.jobs) {
      const jobHandler = this._jobHandlers.find(x => x.type === job.type);
      if (!jobHandler) {
        throw new Error(`Could not find a handler for job type "${job.type}".`);
      }

      jobHandler.utils = this.createUtils();

      try {
        jobHandler.verify(job);
      } catch (innerError) {
        const error = new Error(`Could not verify configuration for job type "${job.type}".`);
        (error as any).innerError = innerError;
      }
    }
  }

  private async cacheUpToDate(context: Context, utils: SkwidJobHandlerUtils): Promise<boolean> {
    const workingDirectory = utils.interpolate<string>('${skwid$.configurationDirectory}', context);
    if (!workingDirectory) {
      return false;
    }

    const cacheFilePath = path.join(workingDirectory, '.skwid-state.json');
    if (!fs.existsSync(cacheFilePath)) {
      return false;
    }

    try {
      const previousState: FileState = JSON.parse(
        fs.readFileSync(cacheFilePath, 'utf-8'));

      // read like gitignore file
      const stateIgnoreEntries = this.readIgnorePatterns(context, workingDirectory);

      const currentFileHashes = await this.readFileStates(
        workingDirectory,
        stateIgnoreEntries);
      const statedFiles = new Set(Object.keys(currentFileHashes));
      const cachedFiles = new Set(Object.keys(previousState));

      const isUnqualSize = statedFiles.size !== cachedFiles.size;
      const cachedFilesDeleted = [...statedFiles].some(x => !cachedFiles.has(x));
      const newFilesDetected = [...cachedFiles].some(x => !statedFiles.has(x));

      if (isUnqualSize || cachedFilesDeleted || newFilesDetected) {
        return false;
      }

      for (const filePath of Object.keys(previousState)) {
        const hash = currentFileHashes[filePath];
        if (!hash || hash !== previousState[filePath]) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  private readIgnorePatterns(context: Context, workingDirectory: string) {
    let stateIgnoreFile: string = '';

    const stateIgnorePath = path.join(workingDirectory, '.skwid-state-ignore');
    if (fs.existsSync(stateIgnorePath)) {
      stateIgnoreFile = fs.readFileSync(stateIgnorePath, 'utf-8');
    }

    const stateIgnoreEntries = stateIgnoreFile
      .split('\n')
      .map(x => x.trim())
      .filter(x => x.length > 0 && !x.startsWith('#'));

    const ignorePatterns = this.createUtils().interpolate<string[]>('${skwid$.configuration.cache.ignore}', context);

    const allIgnoreEntries = [...stateIgnoreEntries, ...ignorePatterns];

    return allIgnoreEntries;
  }

  public async readFileStates(
    workingDirectory: string,
    stateIgnoreEntries: string[],
    results: FileState = {}
  ): Promise<FileState> {
    const files = await fg('**/*', {
      cwd: workingDirectory,
      ignore: [...stateIgnoreEntries, '.skwid-state.json'],
      dot: true,
      onlyFiles: true,
      followSymbolicLinks: true
    });
    await Promise.all(
      files.map(async (relativePath) => {
        const fullPath = path.join(workingDirectory, relativePath);
        results[relativePath] = await this.hashFile(fullPath);
      })
    );
    return results;
  }

  public async hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // xxhash64 is vastly faster than md5 or sha256 for integrity checks
      const availableHashingMethods = getHashes();
      const hash = createHash(
        availableHashingMethods.includes('xxhash64')
          ? 'xxhash64'
          : 'md5');

      const stream = createReadStream(filePath);

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (err) => reject(err));
    });
  }

  public async processTask(task: SkwidTask, context: Context): Promise<void> {
    if (!task.jobs || !Array.isArray(task.jobs)) {
      // TODO: Implement Log Service and print warning about jobs that were empty
      return;
    }

    const utils = this.createUtils();
    const ignoreCache = utils.interpolate<boolean>('${skwid$.ignoreCache}', context);

    if (task.cached && !ignoreCache) {
      const isCacheUpToDate = await this.cacheUpToDate(context, utils);

      if (isCacheUpToDate) {
        this.createUtils().print(
          chalk.yellow(`\n☢ Skipping task as it is cached and up to date.\n\n`),
          context);
        return;
      }
    }

    await this.processJobs(task.jobs, context);

    const workingDirectory = utils.interpolate<string>('${skwid$.configurationDirectory}', context);
    const fileStates = await this.readFileStates(
      workingDirectory,
      this.readIgnorePatterns(context, workingDirectory));

    const cacheFilePath = path.join(
      utils.interpolate<string>('${skwid$.configurationDirectory}', context),
      '.skwid-state.json');

    fs.writeFileSync(cacheFilePath, JSON.stringify(fileStates, null, 2));
  }
  //#endregion

  //#region Private Methods
  private async processJobs(jobs: SkwidJob[], context: Context): Promise<void> {
    for (const job of jobs) {
      const jobHandler = this._jobHandlers!.find(x =>
        x.type === job.type);

      const utils = this.createUtils();
      jobHandler!.utils = utils;

      try {
        let name = 'Running job';
        if (job.name) {
          name = this.createUtils().interpolate(job.name, context);
        }

        context.variables.skwidJob$ = { name };

        const breadcrumbsJoin = ' 〉';
        const breadcrumbs: string = utils
          .getBreadcrumbs(context)
          .map(x => `${chalk.bgHex('#0e3559')(chalk.white(` ${x} `))}`)
          .join(chalk.bgHex('#ffc400')(chalk.black(breadcrumbsJoin)));

        utils.print(`${chalk.bgHex('#ffc400')(chalk.black(' 〉'))}${breadcrumbs}\n\n`, context);

        const jobResult = await jobHandler!.handleJob(job, context);
        utils.print('\n', context);
        if (jobResult && jobResult.cancelFlow) {
          utils.print(chalk.yellow(`\n☢ ${name} task flow was cancelled here.\n\n`), context);
          break;
        }

        if (jobResult && job.storeResultAs) {
          context.variables[job.storeResultAs] = jobResult.result;
        }

        //utils.print(chalk.greenBright(`\t\t\t ──> ✅ done.\n\n`), context);
      } catch (error) {
        if (job.continueOnError) {
          continue;
        }

        throw error;
      }
    }
  }

  private createUtils(): SkwidJobHandlerUtils {
    const utils = {
      print: (data: any, _: Context, outputChannel: 'stdout' | 'stderr' = 'stdout') => {
        //const contextLevel = context.level;
        const prefixText = ''; // Array.from(new Array(Math.max(0, contextLevel - 3))).map(() => '   ').join('');
        (process as any)[outputChannel].write(prefixText);
        (process as any)[outputChannel].write(data);
      },
      interpolate: <T>(input: string, context: Context): T => {
        if (typeof input !== 'string') {
          return input;
        }

        const mergedContext = context.mergeDown();
        try {
          const scalarResultRegex = /^\$\{([^\}]+)}$/g;
          if (scalarResultRegex.test(input)) {
            const script = /^\$\{([^\}]+)}$/g.exec(input)![1];
            return this.getScriptResult(script, mergedContext)
          }

          let oldString = '';
          let newString = input;
          while (newString !== oldString) {
            oldString = newString;

            newString = newString
              .replace(/\$\{([^\}]+)}/g,
                (_, interpolationKey) =>
                  this.getScriptResult<string>(interpolationKey, mergedContext));
          }

          return newString as unknown as T;
        } catch (error) {
          throw new Error(`Could not interpolate string '${input}':
            ${(error as Error).toString()}`);
        }
      },
      resolveVariable: (name: string, context: Context) => {
        let value = undefined;
        let current = context;
        while (!value && current) {
          value = current.variables[name];
          current = current.parent!;
        }
        return value;
      },
      getBreadcrumbs: (context: Context) => {
        const breadCrumbs: string[] = [];
        let currentContext: Context | undefined = context;

        while (currentContext) {
          if (currentContext?.variables?.skwidJob$?.name) {
            breadCrumbs.unshift(currentContext.variables.skwidJob$.name);
          }

          currentContext = currentContext.parent;
        }

        return breadCrumbs;
      },
      evaluateCondition: (condition: string, context: Context): boolean => {
        const interpolatedCondition = utils.interpolate<string>(condition, context);
        const mergedContext = context.mergeDown();
        return this.getScriptResult(interpolatedCondition, mergedContext);
      },
      runChildJobs: async (jobs: SkwidJob[], context: Context) => {
        return this.processJobs(jobs, context);
      },
      setSkwidExitCode: (exitCode: number) =>
        process.exit(exitCode)
    };
    return utils;
  }

  private getScriptResult<T>(returnValueAsJsString: string, mergedContext: Context): T {
    let resultingValue: any;
    const vm = new NodeVM({
      sandbox: {
        ...mergedContext.variables,
        osType: require('os').type(),
        osArch: require('os').arch(),
        resolveWith: (resolution: any) =>
          resultingValue = resolution
      }
    });

    vm.run('resolveWith(' + returnValueAsJsString + ')');
    return resultingValue;
  }
  //#endregion
}