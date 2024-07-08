#!/usr/bin/env node

const { createReadStream } = require("node:fs");

class Node {
  constructor(word) {
    this.word = word;
    this.next = null;
  }
}

const tallyPhrasesInWordList = (listHead, phraseCounts) => {
  // ensure there are at least 3 nodes in the list
  if (!listHead.next?.next?.next) {
    return;
  }

  while (listHead.next.next.next !== null) {
    const triplet = [listHead.next, listHead.next.next, listHead.next.next.next]
      .map((node) => node.word)
      .join(" ");

    if (phraseCounts[triplet] === undefined) {
      phraseCounts[triplet] = 1;
    } else {
      phraseCounts[triplet] += 1;
    }
    listHead.next = listHead.next.next;
  }
};

const outputCounts = (phraseCounts) => {
  const mostCommonPhrases = Object.entries(phraseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100);

  if (mostCommonPhrases.length < 1) {
    console.log(
      "The provided file(s) did not have any three word phrases! It could mean each file had two or fewer words. Please try again."
    );
    return;
  }

  console.log(
    `The ${mostCommonPhrases.length} most common 3 word phrases are:`
  );

  mostCommonPhrases.forEach((pair) => {
    const [phrase, count] = pair;
    console.log(`${phrase} - ${count}`);
  });
};

const processStream = (readableStream, phraseCounts) => {
  const streamPromise = new Promise((res, rej) => {
    const listHead = new Node(null);
    let lastNode = listHead;
    let prevChunkEndsWithLetter = false;

    readableStream.on("data", (data) => {
      data = data.replace(/['’"]/gu, "");
      const words = data.toLowerCase().match(/[\p{L}\p{M}]+/gu);

      let currChunkBeginsWithLetter = /^[\p{L}\p{M}]/u.test(data);
      let currChunkEndsWithLetter = /[\p{L}\p{M}]$/u.test(data);

      // If curr chunk ends in a letter character, assume the last word is split. Save partial word for the next chunk
      let partialLastWord;
      if (currChunkEndsWithLetter) {
        partialLastWord = words.pop();
      }

      // Add all words to the linked list
      words.forEach((word, idx) => {
        if (idx === 0 && prevChunkEndsWithLetter && currChunkBeginsWithLetter) {
          lastNode.word += word;
        } else {
          lastNode.next = new Node(word);
          lastNode = lastNode.next;
        }
      });

      prevChunkEndsWithLetter = currChunkEndsWithLetter;

      tallyPhrasesInWordList(listHead, phraseCounts);

      // If there was a split last word in this chunk, add it back onto the end of the list for the next chunk
      if (partialLastWord) {
        lastNode.next = new Node(partialLastWord);
        lastNode = lastNode.next;
      }
    });

    readableStream.on("close", () => {
      // If the file ends on a letter char, one last tally needs to be added to the counts
      tallyPhrasesInWordList(listHead, phraseCounts);
      res();
    });

    readableStream.on("error", (err) => {
      if (err.code === "ENOENT") {
        console.log(`No file found: ${err.path} does not exist!\n`);
        return;
      }
      console.error("An unknown error occured!");
      rej(err);
    });
  });

  return streamPromise;
};

const parsePhrases = async () => {
  const { stdin } = process;
  const pipedInput = stdin.constructor.name === "Socket";

  const cwd = process.cwd();
  const filePaths = process.argv.slice(2);

  const phraseCounts = {};

  const streams = filePaths.map((path) => {
    const readableStream = createReadStream(`${cwd}/${path}`, "utf-8");
    return processStream(readableStream, phraseCounts);
  });

  // TODO add back in for debugging purposes
  if (pipedInput) {
    stdin.setEncoding("utf-8");
    streams.push(processStream(stdin, phraseCounts));
  }

  if (streams.length === 0) {
    console.log(
      "No files provided! Please provide a file name as an argument or pipe a file into stdin."
    );
    return;
  }

  await Promise.allSettled(streams);
  outputCounts(phraseCounts);
};

module.exports = {
  parsePhrases,
  processStream,
  outputCounts,
  tallyPhrasesInWordList,
};

parsePhrases();
