import { ReflowDirection } from "reflow/reflowTypes";
import {
  getEdgeDirection,
  getMoveDirection,
  getReflowedSpaces,
  modifyDrawingRectangles,
} from "./canvasDraggingUtils";

describe("test canvasDraggingUtils Methods", () => {
  describe("test getEdgeDirection method", () => {
    it("should return RIGHT if closest to left edge", () => {
      expect(getEdgeDirection(5, 10, 100, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.RIGHT,
      );
    });
    it("should return BOTTOM if closest to left edge", () => {
      expect(getEdgeDirection(10, 5, 100, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.BOTTOM,
      );
    });
    it("should return LEFT if closest to left edge", () => {
      expect(getEdgeDirection(95, 10, 100, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.LEFT,
      );
    });
    it("should return current direction if width is undefined", () => {
      expect(getEdgeDirection(5, 10, undefined, ReflowDirection.UNSET)).toEqual(
        ReflowDirection.UNSET,
      );
    });
  });

  it("test getReflowedSpaces method, should return reflowed spaces", () => {
    const occupiedSpace = {
      id: "id",
      left: 10,
      top: 10,
      right: 50,
      bottom: 70,
    };

    const reflowingWidgets = {
      id: {
        X: 30,
        Y: 40,
        width: 300,
        height: 500,
      },
    };

    const reflowedSpace = {
      id: "id",
      left: 13,
      top: 14,
      right: 43,
      bottom: 64,
    };

    expect(getReflowedSpaces(occupiedSpace, reflowingWidgets, 10, 10)).toEqual(
      reflowedSpace,
    );
  });

  it("test modifyDrawingRectangles method, should return widgetDraggingBlock with dimensions of the space widget", () => {
    const drawingRectangles = {
      left: 104,
      top: 102,
      width: 600,
      height: 900,
      columnWidth: 60,
      rowHeight: 90,
      widgetId: "id",
      isNotColliding: true,
    };
    const spaceMap = {
      id: {
        left: 25,
        top: 30,
        right: 65,
        bottom: 80,
        id: "id",
      },
    };
    const modifiedRectangle = {
      left: 254,
      top: 302,
      width: 400,
      height: 500,
      columnWidth: 40,
      rowHeight: 50,
      widgetId: "id",
      isNotColliding: true,
    };

    expect(
      modifyDrawingRectangles([drawingRectangles], spaceMap, 10, 10),
    ).toEqual([modifiedRectangle]);
  });

  describe("test getMoveDirection method", () => {
    const prevPosition = {
      id: "id",
      left: 10,
      top: 20,
      right: 30,
      bottom: 40,
    };

    it("should return RIGHT when moved to Right", () => {
      const currentPosition = {
        id: "id",
        left: 11,
        top: 20,
        right: 31,
        bottom: 40,
      };
      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.RIGHT);
    });
    it("should return BOTTOM when moved to bottom", () => {
      const currentPosition = {
        id: "id",
        left: 10,
        top: 21,
        right: 30,
        bottom: 41,
      };
      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.BOTTOM);
    });
    it("should return LEFT when moved to left", () => {
      const currentPosition = {
        id: "id",
        left: 9,
        top: 20,
        right: 29,
        bottom: 40,
      };
      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.LEFT);
    });
    it("should return TOP when moved to top", () => {
      const currentPosition = {
        id: "id",
        left: 10,
        top: 19,
        right: 30,
        bottom: 39,
      };
      expect(
        getMoveDirection(prevPosition, currentPosition, ReflowDirection.UNSET),
      ).toEqual(ReflowDirection.TOP);
    });
  });
});
