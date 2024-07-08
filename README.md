# phrase-parser

## Usage

### Quickstart

For a quick demo, simply run `npm start` to run the program against the included sample files.

Or, to see it with a larger data set, use `npm run large` to run against the full text of Moby Dick.

### With `node.js` installed locally:

If Node is installed locally, you can run the script by running the following command in the terminal from the directory in which the script file is located:

`./phrase-parser.js [YOURFILE.txt] [YOURFILE2.txt] [YOURFILE3.txt]`

Additionally, the program can accept input on `stdin` with the following command:

`cat YOURFILE.txt | ./phrase-parser.js`

At least one file input should be provided to the script. `stdin` and argument file paths can be used in conjunction with each other.

### In a Docker container:

The script can also be run in a docker container. The docker command must be executed from the directory which contains the files you wish to process.

After the docker image has been downloaded, run the following command:

`cd /path/to/your/files`

`docker run -v "$(pwd):/usr/src/app/files/" parse-phrases:1.0 files/YOURFILE.txt` 

**Note:** In order to avoid copying large text files, the above command maps your current directory into a subfolder inside the container. As such, each file path argument must be prepended with the sub-directory which you are volume mapping to inside the container

**`stdin` Limitation**: If running in a docker container, the script currently cannot accept a file piped to `stdin`. Please provide all files to process as an argument, with each file path prepended with the subdirectory per the note above.

### Tests

execute `npm run test` to run the included Jest test suite.

## Project Requirement Assumptions

Based off the README project requirements, the following assumptions were made for certain scenarios:

1. Only `.txt` files needed to be supported
2. If the program is provided with multiple files to process, the final output is the combination of 100 most frequent three word phrases contained in *all* the files, instead of showing each file's 100 most common phrases. Put another way, no matter how many files are processed, the final output will be at most 100 three word phrases. However, when tallying three word phrases, each file is considered in isolation (e.g. the last word of one file is not joined into the first two words of the next file)
3. Words can be reused in different three word phrases. For example, if the program runs against `moby_dick.txt`, the most frequent three word phrase is `the sperm whale`. However, the phrase `sperm whale had` appears 5 times, and would be considered a distinct three word phrase. This reuse is more apparent in shorter text documents.
4. Numeric characters are considered valid as a part of a three word phrase

## Processing large datasets

#### Memory Limitations

The original implementation simply read the entire file(s) into memory and then operated on them as a string. While this works for smaller datasets (the entire text of Moby Dick takes only 1MB as plaintext), if the application needed to run on 1000 copies of Moby Dick or other very large files, then the program would eventually run into memory limitations. In order to solve this, the program was migrated to utilize the `ReadableStream` API, and processes each individual data chunk asynchronously, as they are loaded into memory. This way, the entire content of the text dataset does not need to be loaded into memory before processing can start to occur.

#### Speed Considerations

In addition to migrating to `ReadableStream`s, the second version of this program also migrated away from using Arrays and instead uses a LinkedList. In order to keep the application performant on large data sets, each data chunk from the `ReadableStream` needs to be processed as much as possible in isolation. As such, with each data chunk, the application tallies all three word phrases loaded at that time (there is some special considerations for the last word of a data chunk, which often is only a partial word). Once a phrase is added to the overall tally, the first word of that phrase is no longer needed and can be garbage collected. The program immediately removes this from the collection of words. Since removing the first element occurs once for **every** item in the list, using an array would make a time complexity of O(N^2). By using a linked list, the time complexity of this operation is reduced to O(N).

## Future Development

Some areas for consideration of additional development:

1. Parameterize the main functionality, such that the user could specify a number for how many of the most frequent phrases to show, as well as modify the length of the phrases being searched. For example, "find the 200 most common 5 word phrases".
2. An option could be added to allow for the final output to show the 100 most frequent phrases in each individual file, rather than collecting into one list for all files.
3. Upgrade the file parsing, to allow the user to use more complex file paths (for example, processing a file in a parent directory). Additionally, adding support for providing directories as an argument and automatically processing any text files contained within that directory
4. Continue to improve optimization for large data sets: there is certainly still some optimization that could be done to improve the processing time. Though files are processed through `ReadableStream` to avoid RAM limitations, the overall processing time could still be improved.
5. Improve user experience: there is little information provided to the end user, especially if there are any errors. Missing files are alerted to the user, but there could be more robust error handling (for example if there is an error when reading a large file)

## Known Issues

There is limited input validation and no file path parsing done on arguments provided. If formatted properly, subdirectories can be used. For example: `subdirectory/file1.txt` would work properly but `../file2.txt` would throw a `no file found` error.

Additionally, there isn't any validation for filetype, so there will be errors if the user passes an unsupported filetype (for example image1.jpg)

There maybe some errors with certain edge conditions as file streams are being processed. 



