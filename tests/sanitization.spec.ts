import each from "jest-each";
import {
  commaSeparatedStringToArray,
  commaSeparatedStringToIntArray,
} from "affiliates-api/sanitization";

describe("sanitization", () => {
  each([
    [null, null],
    [undefined, undefined],
    [1, 1],
    [
      [1, 2],
      [1, 2],
    ],
    [
      ["1", "2"],
      ["1", "2"],
    ],
    ["", [""]],
    ["test", ["test"]],
    ["test1,test2", ["test1", "test2"]],
  ]).it("commaSeparatedStringToArray should return as expected", (input, output) => {
    expect(commaSeparatedStringToArray(input)).toStrictEqual(output);
  });
  each([
    [null, null],
    ["2,3", [2, 3]],
    ["2,ye,3", [2, 3]],
    ["yo,yoo", []],
  ]).it("commaSeparatedStringToIntArray should return as expected", (input, output) => {
    expect(commaSeparatedStringToIntArray(input)).toStrictEqual(output);
  });
});
