# Skwid Configuration Reference

- [Job Types](#job-types)
  - [Declare](#declare)
  - [Command](#command)
  - [Condition Job](#condition-job)
  - [Repeat Job](#repeat-job)
    - [Repeat while](#repeat-while)
    - [Repeat From ... To](#repeat-from--to)
    - [Repeat for each item in a list](#repeat-for-each-item-in-a-list)

## Job Types

### Declare

A declare job sets new values for either existing variables or variables to create. If variables to not exist yet, the declare job will create them.

<u>**Options**</u>

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|---------------|
| name | `string` | Freely chosen caption of the job. Will be displayed to the user. | Yes |
| storeResultAs | `string` | If the job has a result value, define a variable name to store the result in. | Yes |
| continueOnError | `boolean` or `string` | Declares if job errors should be ignored. | Yes |
| silent | `boolean` or `string` | Declares wether this job is silent, printing only it's caption. | Yes |
| type             | `'declare'`                | Type must be set to `declare`                  |
| variables        | `Dictionary<string, any>`  | Object dictionary containing key-value pairs of variables to define. See example for more details |

```yaml
jobs:
  - name: Declaring global task variables
    type: declare
    variables:
      projectName: test
      version: "1.0.0"
```


### Command

A command job executes a given command on the shell. It supports combining them like you would do in, e.g. bash or zsh. The output can be printed to the user (default behavior).

<u>**Options**</u>

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|-----------------------|
| name | `string` | Freely chosen caption of the job. Will be displayed to the user | Yes |
| storeResultAs | `string` | If the job has a result value, define a variable name to store the result in. | Yes |
| continueOnError | `boolean` or `string` | Declares if job errors should be ignored. | Yes |
| silent | `boolean` or `string` | Declares wether this job is silent, printing only it's caption. | Yes |
| type | `'command'` | Type must be set to `command` |  |
| command | `string`  | The command(s) to execute. | Yes |
| workingDirectory | `string` | Directory where to execute the command in. Defaults to the directory of the Skwid configuration file.|Yes |
| shell | `string` | Shell to run the command in. Defaults to `/bin/sh`.|Yes |

<u>**Result**</u>

The result value is the `stdout` of the executed commands. E.g., setting `command` to `echo 'Hello World'` will result in the value `Hello World` after execution.

<u>**Examples**</u>

```yaml
jobs:
  - name: Print vars for item
    type: command
    command: sleep 2 && echo 'Hello World'
```

### Condition Job

The condition job is checking a condition for truthiness. If the condition is true, the subset ob jobs defined in its `jobs` property will be executed. If the condition is false, it will skip executing its job subset.

<u>**Options**</u>

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|-----------------------|
| name | `string` | Freely chosen caption of the job. Will be displayed to the user | Yes |
| storeResultAs | `string` | If the job has a result value, define a variable name to store the result in. | Yes |
| continueOnError | `boolean` or `string` | Declares if job errors should be ignored. | Yes |
| silent | `boolean` or `string` | Declares wether this job is silent, printing only it's caption. | Yes |
| type | `'condition'` | Type must be set to `condition` |  |
| condition | `string` | The condition to check for truthiness. Must be valid JavaScript. See example for more info. | Yes |
| jobs | `SkwidJob[]` | A list of jobs to execute when the condition is true. | |

<u>**Examples**</u>

**Example with a condition using string interpolation**
```yaml
variables:
  shouldPrint: true

jobs:
  - name: Check for printing enabled
    type: condition

    # Single value string interpolation
    condition: ${shouldPrint}

    jobs:
      - name: Say something
        type: command
        command: echo "Hello World!"
```

**Example with a condition including a primitive value**
```yaml

variables:
  shouldPrint: &shouldPrint true

jobs:
  - name: Check for printing enabled
    type: condition

    # Primitive value `true`, referenced by an anchor
    condition: *shouldPrint
    jobs:
      - name: Say something
        type: command
        command: echo "Hello World!"
```

**Example with a condition using a complex string interpolation**
```yaml
variables:
  shouldPrint: true
  username: 'Max'

jobs:
  - name: Check for printing enabled
    type: condition

    # Complex condition
    condition: username === 'Max' && shouldPrint

    jobs:
      - name: Say something
        type: command
        command: echo "Hello ${username}"
```



### Repeat Job

The condition job is checking a condition for truthiness. If the condition is true, the subset ob jobs defined in its `jobs` property will be executed. If the condition is false, it will skip executing its job subset.

<u>**General Options**</u>

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|-----------------------|
| name | `string` | Freely chosen caption of the job. Will be displayed to the user | Yes |
| storeResultAs | `string` | If the job has a result value, define a variable name to store the result in. | Yes |
| continueOnError | `boolean` or `string` | Declares if job errors should be ignored. | Yes |
| silent | `boolean` or `string` | Declares wether this job is silent, printing only it's caption. | Yes |
| type | `'condition'` | Type must be set to `condition` |  |
| jobs | `SkwidJob[]` | A list of jobs to execute when the condition is true. | |


#### Repeat while

You can use the repeat job to re-run a set of jobs as long as a condition is truthy. The check behavior is the same as for the condition job.

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|-----------------------|
| while | `string` | The condition to check for truthiness. Must be valid JavaScript. See example for more info. | Yes |

<u>**Examples**</u>

**Example with a condition using string interpolation**
```yaml
variables:
  shouldPrint: true

jobs:
  - name: PrintEnv
    type: repeat

    # Single value string interpolation
    while: ${shouldPrint}

    jobs:
      - name: Print env
        type: command
        command: echo 'Hi'
```

<u>**While-Specific Options**</u>

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|-----------------------|
| while | `string` | The condition to check for truthiness. Must be valid JavaScript. See example for more info. Cannot be used together with `from` or `forEach`| Yes |

<u>**Examples**</u>

```yaml
variables:
  shouldPrint: true

jobs:
  - name: PrintEnv
    type: repeat

    # Single value string interpolation
    while: ${shouldPrint}

    jobs:
      - name: Print env
        type: command
        command: printenv
        workingDirectory: ./test
```

#### Repeat From ... To

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|-----------------------|
| from | `number` or `string` | Set the number the loop should start with. Cannot be used together with `while` or `forEach`. Must be used with `to`.| Yes |
| to | `number` or `string` | Set the number the loop should end with. Must be used with `from`. | Yes |
| step | `number` or `string` | Set the step that should be made after each iteration. Defaults to `1`. May contain negative values. Must be used with `from` | Yes
| index | `string` | Sets the variable name for making current iteration index available to the sub-jobs | |

<u>**Examples**</u>

```yaml
variables:
  from: 20
  to: 0
  step: -2

jobs:
  - name: PrintEnv
    type: repeat

    from: ${from}
    to: ${to}
    step: ${step}
    index: i

    jobs:
      - name: Print number
        type: command
        command: echo ${i}
```



#### Repeat for each item in a list

| Name             | Type                       | Description                                    | [Interpolation](./interpolation.md) |
|------------------|----------------------------|------------------------------------------------|-----------------------|
| forEach | `string` | The variable name under which the current item will be available to the sub-jobs per loop iteration | |
| of | `any[]` or `string` | The list to iterate through. Must be used with `forEach` | Yes |
| index | `string` | Sets the variable name for making current iteration index available to the sub-jobs | |

<u>**Examples**</u>

```yaml
variables:
  list: &list
    - Sam
    - Max
    - Will

jobs:
  - name: Print all names
    type: repeat

    forEach: name
    of: ${list} # Alternatively without interpolation: *list

    index: i

    jobs:
      - name: Print name
        type: command
        command: echo ${i} - ${name}
```
