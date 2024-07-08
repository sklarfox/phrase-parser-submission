const fs = require("fs");
const { PassThrough } = require("node:stream");
const { processStream } = require("./parse-phrases.js");

jest.mock("fs");

describe("processStream", () => {
  test("correctly tallies first three words", async () => {
    const mockData =
      "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.";
    const mockStream = new PassThrough();
    mockStream.setEncoding("utf-8");
    const phraseCounts = {};
    const streamPromise = processStream(mockStream, phraseCounts);

    mockStream.end(mockData);
    await streamPromise;
    expect(phraseCounts["call me ishmael"]).toBe(1);
  });

  test("correctly tallies last three words when data ends on a letter char", async () => {
    const mockData =
      "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.";
    const mockStream = new PassThrough();
    mockStream.setEncoding("utf-8");
    const phraseCounts = {};
    const streamPromise = processStream(mockStream, phraseCounts);

    mockStream.end(mockData);
    await streamPromise;
    expect(phraseCounts["ocean with me"]).toBe(1);
  });

  test("correctly tallies last three words when data ends on non letter char", async () => {
    const mockData =
      "Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me";
    const mockStream = new PassThrough();
    mockStream.setEncoding("utf-8");
    const phraseCounts = {};
    const streamPromise = processStream(mockStream, phraseCounts);

    mockStream.end(mockData);
    await streamPromise;
    expect(phraseCounts["ocean with me"]).toBe(1);
  });

  test("is case insensitive", async () => {
    const mockData = "I love sandwiches. I LOVE SANDWICHES";
    const mockStream = new PassThrough();
    mockStream.setEncoding("utf-8");
    const phraseCounts = {};
    const streamPromise = processStream(mockStream, phraseCounts);

    mockStream.end(mockData);
    await streamPromise;
    expect(phraseCounts["i love sandwiches"]).toBe(2);
  });

  test("ignores punctuation", async () => {
    const mockData = "I love sandwiches!!!!! I love sandwhiches.";
    const mockStream = new PassThrough();
    mockStream.setEncoding("utf-8");
    const phraseCounts = {};
    const streamPromise = processStream(mockStream, phraseCounts);

    mockStream.end(mockData);
    await streamPromise;
    expect(phraseCounts["sandwiches i love"]).toBe(1);
  });

  test("contractions aren't broken into two words", async () => {
    const mockData = "Shouldn't becomes shouldnt";
    const mockStream = new PassThrough();
    mockStream.setEncoding("utf-8");
    const phraseCounts = {};
    const streamPromise = processStream(mockStream, phraseCounts);

    mockStream.end(mockData);
    await streamPromise;

    expect(phraseCounts["shouldnt becomes shouldnt"]).toBe(1);
    expect(phraseCounts["shouldn t becomes"]).toBe(undefined);
  });
});
