#!/usr/bin/env node
/// <reference path="./globals.d.ts" />
import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';

import { Container } from 'inversify';
import { Command } from 'commander';
import { InjectionTokens as GlobalInjectionTokens } from '@codewyre/skwid-contracts';

import { SkwidTaskProcessor } from './services/skwid-task-processor';
import { CommanderFactory } from './services/commander-factory';
import { ConfigurationService } from './services/configuration.service';
import { ContextManagerService } from './services/context-manager.service';
import { SkwidCommandJobHandler } from './job-handlers/skwid-command.job-handler';
import { SkwidDeclareJobHandler } from './job-handlers/skwid-declare.job-handler';
import { SkwidConditionJobHandler } from './job-handlers/skwid-condition.job-handler';
import { SkwidRepeatJobHandler } from './job-handlers/skwid-repeat.job-handler';
import { InjectionTokens } from './configuration/injection-tokens.enum';
import { Application } from './app/application';
import { SkwidSolutionJobHandler } from './job-handlers/skwid-solution.job-handler';
import { SolutionManager } from './services/solution-manager';
import { SkwidProjectSourceProvider } from './models/skwid-project-source.provider';
import { FixedProjectProvider } from './services/fixed.project-provider';

function findPackageInfo(): any {
  let possiblePath = __dirname;
  while (possiblePath) {
    let configPath = path.join(possiblePath, 'package.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath).toString());
    }

    possiblePath = path.dirname(possiblePath);
  }

  return null;
}

const providers: Array<any> = [
  Application,
  ConfigurationService,
  ContextManagerService,
  CommanderFactory,
  SolutionManager,
  SkwidSolutionJobHandler,
  SkwidTaskProcessor,
  { provide: Command, useValue: new Command() },
  { provide: SkwidProjectSourceProvider, useClass: FixedProjectProvider },
  { provide: GlobalInjectionTokens.SkwidJobHandler, useClass: SkwidCommandJobHandler },
  { provide: GlobalInjectionTokens.SkwidJobHandler, useClass: SkwidDeclareJobHandler },
  { provide: GlobalInjectionTokens.SkwidJobHandler, useClass: SkwidConditionJobHandler },
  { provide: GlobalInjectionTokens.SkwidJobHandler, useClass: SkwidRepeatJobHandler },
  { provide: InjectionTokens.PathService, useValue: path },
  { provide: InjectionTokens.FileSystemService, useValue: fs },
  { provide: InjectionTokens.YamlService, useValue: yaml },
  { provide: InjectionTokens.ProcessInfo, useValue: process },
  { provide: InjectionTokens.PackageInfo, useValue: findPackageInfo() }
];

const container = new Container();

for (const provider of providers) {
  if (provider.provide) {
    const { useValue, provide, useClass } = provider;

    const binding  = container
      .bind(provide);

    if (useValue) {
      binding.toConstantValue(useValue);
    } else {
      binding
        .to(useClass)
        .inSingletonScope();
    }
    continue;
  }

  container
    .bind(provider)
    .toSelf()
    .inSingletonScope();
}

container
  .get(Application)
  .run();