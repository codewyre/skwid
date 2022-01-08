#!/usr/bin/env node
/// <reference path="./globals.d.ts" />
import 'reflect-metadata';
import { bootstrap } from '@codewyre/wyrekit-inversify-modules';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { InjectionTokens } from './configuration/injection-tokens.enum';
import * as yaml from 'yaml';
import { Application } from './app/application';

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


bootstrap(
  AppModule, {
    providers: [
      { provide: InjectionTokens.PathService, useValue: path },
      { provide: InjectionTokens.FileSystemService, useValue: fs },
      { provide: InjectionTokens.YamlService, useValue: yaml },
      { provide: InjectionTokens.ProcessInfo, useValue: process },
      { provide: InjectionTokens.PackageInfo, useValue: findPackageInfo() }
    ]
  })
  .get(Application)
  .run();

