# skwid - Multi-Technology Development made easy!

Makefiles, grunt, Shell Scripts, gulp, yarn, npm, maven...... Feeling like in a config hell? Want one central point to control everything? Missing documentation? Here comes Skwid!

Skwid (`/skwɪd/`) is a tool wanting to be the command center of your project. It provides:

  - A modular project configuration, including tasks, variables and more.
  - A single definition language, independent from the technology used.
  - Declarative and documentable definition language.
  - Logical Flow Control of your project processes
  - Pluggable job system - Missing something? Add it! \o/


## Obtain skwid

Currently, Skwid is available as an NPM package only. Though, there is the plan to migrate this to e.g. Chocolatey, apt, yum or brew.

### Using Yarn
```
yarn global add @codewyre/skwid
```

### Using npm
```
npm install -g @codewyre/skwid
```

## Using skwid

Create a `skwid.yaml` file in your project. Then, head into the command line and enter:

`skwid`

This should print you all available commands on root level and their descriptions, arguments, as well as options:

```
Usage: skwid [options]

Options:
  --debug        Enable detailed debug.
  -V, --version  output the version number
  -h, --help     display help for command
```

## Configuring skwid

**⚠️⚠️⚠️ For a Detailed documentation refer to the [Skwid Documentation](./docs/README.md)**

### Adding variables

You can add variables that you want to use to the `variables` block of your `skwid.yaml`. All kind's of yaml data types are supported, even anchors.

```yaml
variables:
  myString: Hello World
  myNumber: 123
  myArray:
    - Entry 1
    - Entry 2
    - Entry 3
  myObject:
    key: value
```

### Configuring tasks

You can attach different cli arguments and sub-arguments by defining tasks in the `tasks` block of your `skwid.yaml`. To achieve a new command, e.g. `skwid run-sample`, add the following to your `skwid.yaml`:

```yaml
tasks:
  run-sample: # Name of the command

    # Description of the command,
    # shown in the --help
    description: Runs the sample

    # List of jobs to execute
    jobs: []
```

### Adding jobs to tasks

Jobs consist either of `children`, or `jobs`. A job is a single part of a whole task. It can be about, e.g. setting variables, repeating something, executing a command or some other things.

Currently, these are the available types shipped out-of-the-box:

- `declare` - Declares variables for this level and all sub-levels of jobs.
- `command` - Runs a command on the shell.
- `condition` - checks a condition to be true and executes sub-jobs.
- `repeat` - repeats a set of sub-jobs for a list, range or condition.

To add a job to a task or a parent job, add it to the `jobs` property:

```yaml
tasks:
  run-sample: # Name of the command
    description: Runs the sample

    # Add the job as a list item in here.
    jobs:
      - name: 'Test' # Name shown in the log when executing
        type: command # Type of the job
        command: echo 'Hello World!' # Command to execute
```

### Sample Config:

```yaml
variables:
  myString: Hello World
  myNumber: 123
  myArray:
    - Entry 1
    - Entry 2
    - Entry 3
  myObject:
    key: value

tasks:
  run-sample:
    description: Runs this demo
    jobs:
      - name: Print string
        type: command
        command: echo ${myString}

      - name: Print number
        type: command
        command: echo ${myNumber}

      - name: Print object value
        type: command
        command: echo '${JSON.stringify(myObject, null, 2)}'

      - name: PrintArray
        type: repeat
        forEach: element
        of: ${myArray}
        index: index

        jobs:
          - name: Print element ${index+1}
            type: command
            command: echo ${element}
```