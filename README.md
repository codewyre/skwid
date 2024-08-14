# skwid - Multi-Technology Development made easy!

Makefiles, grunt, Shell Scripts, gulp, yarn, npm,
maven...... Feeling like in a config hell? Want one central point to control everything? Missing documentation? Here comes Skwid!

Skwid (`/skwɪd/`, like squid) is a tool wanting to be the command center of your project. It provides:

  - A modular project configuration, including tasks, variables and more.
  - A single definition language, independent from the technology used.
  - Declarative and documentable definition language.
  - Logical Flow Control of your project processes
  - Pluggable job system - Missing something? Add it! \o/

**Quick Access:**
- [Obtain skwid](#obtain-skwid)
  - [Using Yarn](#using-yarn)
  - [Using npm](#using-npm)
- [Using skwid](#using-skwid)
- [Configuring skwid solutions](#configuring-skwid-solutions)
  - [Using a self-configured list](#using-a-self-configured-list)
  - [Using a 3rd-party managed project list](#using-a-3rd-party-managed-project-list)
    - [Lerna](#lerna)
    - [Yarn Workspaces](#yarn-workspaces)
- [Configuring skwid projects](#configuring-skwid-projects)
  - [Adding variables](#adding-variables)
  - [Configuring tasks](#configuring-tasks)
  - [Adding jobs to tasks](#adding-jobs-to-tasks)
  - [Sample Config](#sample-config)
- [Contribution](#contribution)


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

## Configuring skwid solutions

You can group projects into (software project) solutions. This will ease the maintenance and development of multiple projects.

To activate `Solution Mode` for a skwid project folder, you need to set the `type` property to `solution`. By default, it is `project`.

After configuration, you can use the following commands:

```sh
# Run command for every project in the solution
skwid solution execute "echo 'Hello World'"

# Run skwid task for every project in the solution
skwid solution run task

# Show information about the loaded solution
skwid solution info
```

### Using a self-configured list

This will configure a fixed list of projects, having skwid files in the given directories per project:

```yaml
type: solution

solution:
  name: My Software Project
  sources:
    - type: items
      items:
        - ./my-project-a
        - ./my-project-b
```

### Using a 3rd-party managed project list

#### Lerna


```yaml
type: solution

solution:
  name: My Software Project
  sources:
    - type: lerna
```

#### Yarn Workspaces


```yaml
type: solution

solution:
  name: My Software Project
  sources:
    - type: yarn-workspace
```

## Configuring skwid projects

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

### Sample Config

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

## Contribution

1. Pull repository
2. Ensure Node and Yarn is installed.
3. Run `yarn` in repository.
4. Run `yarn build` in repository.
5. `node projects/skwid/dist/index.js`