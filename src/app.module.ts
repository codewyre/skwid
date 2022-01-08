import { Module } from '@codewyre/wyrekit-inversify-modules';
import { Command } from 'commander';
import { SkwidTaskProcessor } from './services/skwid-task-processor';
import { Application } from './app/application';
import { CommanderFactory } from './services/commander-factory';
import { ConfigurationService } from './services/configuration.service';
import { ContextManagerService } from './services/context-manager.service';
import { InjectionTokens } from '@codewyre/skwid-contracts';
import { SkwidCommandJobHandler } from './job-handlers/skwid-command.job-handler';
import { SkwidDeclareJobHandler } from './job-handlers/skwid-declare.job-handler';
import { SkwidConditionJobHandler } from './job-handlers/skwid-condition.job-handler';
import { SkwidRepeatJobHandler } from './job-handlers/skwid-repeat.job-handler';

@Module({
  providers: [
    Application,
    ConfigurationService,
    ContextManagerService,
    CommanderFactory,
    SkwidTaskProcessor,
    { provide: Command, useValue: new Command() },

    { provide: InjectionTokens.SkwidJobHandler, useClass: SkwidCommandJobHandler },
    { provide: InjectionTokens.SkwidJobHandler, useClass: SkwidDeclareJobHandler },
    { provide: InjectionTokens.SkwidJobHandler, useClass: SkwidConditionJobHandler },
    { provide: InjectionTokens.SkwidJobHandler, useClass: SkwidRepeatJobHandler }
  ]
})
export class AppModule {

}