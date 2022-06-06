## Abstraction
This source builds `tokenquote` command which does following tasks:
- Given no parameters, return the latest portfolio value per token in USD
- Given a token, return the latest portfolio value for that token in USD
- Given a date, return the portfolio value per token in USD on that date
- Given a date and a token, return the portfolio value of that token in USD on that date

The CSV file has the following columns
- timestamp: Integer number of seconds since the Epoch
- transaction_type: Either a DEPOSIT or a WITHDRAWAL
- token: The token symbol
- amount: The amount transacted

## Installation
1. Clone this repo on your local machine
2. `npm install -g .`

## Command usage
```
Usage: tokenquote -f <csv_filepath>

Options:
      --version    Show version number                                 [boolean]
  -l, --languages  List all supported languages.                       [boolean]
  -v               Display logs                                        [boolean]
  -f               Pass the csv file to be parsed            [string] [required]
      --token      Pass token to show only transactions associate with this
                   token                                                [string]
      --date       Pass date to show only transactions before or equal this date
                                                                        [string]
      --help       Show help                                           [boolean]
```

## Running Tests
1. `npm install`
2. `npm run test`

Test coverage is at 100%. Please view the attached https://github.com/lytienphuc0810/interview/blob/main/coverage.png
