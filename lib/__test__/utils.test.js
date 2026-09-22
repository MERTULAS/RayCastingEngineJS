import { clipIntervalCalculation } from '../utils';

describe('Utils Tests', () => {

  test('should be ready for utils tests', () => {
    // Placeholder test
    expect(true).toBe(true);
  });

  describe('clipIntervalCalculation function tests', () => {

    test('castedTile limits is not in the available clip areas cases works correctly', () => {
      const currentAvailableClipAreas = [[2, 0]];
      const castedTile = { ceilHeight: 3.5, floorHeight: 2.5 };

      const result = clipIntervalCalculation(currentAvailableClipAreas, castedTile);

      expect(result.newIntervalsForCastedTile).toEqual([]);
      expect(result.newAvailableClipAreas).toHaveLength(1);
      expect(result.newAvailableClipAreas).toEqual([[2, 0]]);

      const castedTile2 = { ceilHeight: -1, floorHeight: -2 };

      const result2 = clipIntervalCalculation(currentAvailableClipAreas, castedTile2);

      expect(result2.newIntervalsForCastedTile).toEqual([]);
      expect(result2.newAvailableClipAreas).toHaveLength(1);
      expect(result2.newAvailableClipAreas).toEqual([[2, 0]]);
    });

    test('castedTile.height is equal to the available clip area cases works correctly', () => {
      const currentAvailableClipAreas = [[2, 0]];

      // if floorHeight is equal to the available clip area's floorHeight
      const castedTile = { ceilHeight: 2, floorHeight: 0 };
      const result = clipIntervalCalculation(currentAvailableClipAreas, castedTile);

      expect(result.newIntervalsForCastedTile).toEqual([[2, 0]]);
      expect(result.newAvailableClipAreas).toHaveLength(0);
      expect(result.newAvailableClipAreas).toEqual([]);


      // if floorHeight is greater than the available clip area's floorHeight
      const castedTile2 = { ceilHeight: 2, floorHeight: 1 };

      const result2 = clipIntervalCalculation(currentAvailableClipAreas, castedTile2);
      expect(result2.newIntervalsForCastedTile).toEqual([[2, 1]]);
      expect(result2.newAvailableClipAreas).toHaveLength(1);
      expect(result2.newAvailableClipAreas).toEqual([[1, 0]]);

      // if floorHeight is lower than the available clip area's floorHeight
      const castedTile3 = { ceilHeight: 2, floorHeight: -1 };

      const result3 = clipIntervalCalculation(currentAvailableClipAreas, castedTile3);
      expect(result3.newIntervalsForCastedTile).toEqual([[2, 0]]);
      expect(result3.newAvailableClipAreas).toHaveLength(0);
      expect(result3.newAvailableClipAreas).toEqual([]);
    });

    test('castedTile.height is greater than the available clip area cases works correctly', () => {
      const currentAvailableClipAreas = [[2, 0]];

      // if floorHeight is equal to the available clip area's floorHeight
      const castedTile = { ceilHeight: 3, floorHeight: 0 };
      const result = clipIntervalCalculation(currentAvailableClipAreas, castedTile);

      expect(result.newIntervalsForCastedTile).toEqual([[2, 0]]);
      expect(result.newAvailableClipAreas).toHaveLength(0);
      expect(result.newAvailableClipAreas).toEqual([]);


      // if floorHeight is greater than the available clip area's floorHeight
      const castedTile2 = { ceilHeight: 3, floorHeight: 1 };

      const result2 = clipIntervalCalculation(currentAvailableClipAreas, castedTile2);
      expect(result2.newIntervalsForCastedTile).toEqual([[2, 1]]);
      expect(result2.newAvailableClipAreas).toHaveLength(1);
      expect(result2.newAvailableClipAreas).toEqual([[1, 0]]);

      // if floorHeight is lower than the available clip area's floorHeight
      const castedTile3 = { ceilHeight: 3, floorHeight: -1 };

      const result3 = clipIntervalCalculation(currentAvailableClipAreas, castedTile3);
      expect(result3.newIntervalsForCastedTile).toEqual([[2, 0]]);
      expect(result3.newAvailableClipAreas).toHaveLength(0);
      expect(result3.newAvailableClipAreas).toEqual([]);
    });

    test('castedTile.height is lower than the available clip area cases works correctly', () => {
      const currentAvailableClipAreas = [[2, 0]];

      // if floorHeight is equal to the available clip area's floorHeight
      const castedTile = { ceilHeight: 1, floorHeight: 0 };
      const result = clipIntervalCalculation(currentAvailableClipAreas, castedTile);

      expect(result.newIntervalsForCastedTile).toEqual([[1, 0]]);
      expect(result.newAvailableClipAreas).toHaveLength(1);
      expect(result.newAvailableClipAreas).toEqual([[2, 1]]);


      // if floorHeight is greater than the available clip area's floorHeight
      const castedTile2 = { ceilHeight: 1, floorHeight: .5 };

      const result2 = clipIntervalCalculation(currentAvailableClipAreas, castedTile2);
      expect(result2.newIntervalsForCastedTile).toEqual([[1, .5]]);
      expect(result2.newAvailableClipAreas).toHaveLength(2);
      expect(result2.newAvailableClipAreas).toEqual([[2, 1], [.5, 0]]);

      // if floorHeight is lower than the available clip area's floorHeight
      const castedTile3 = { ceilHeight: 1, floorHeight: -1 };

      const result3 = clipIntervalCalculation(currentAvailableClipAreas, castedTile3);
      expect(result3.newIntervalsForCastedTile).toEqual([[1, 0]]);
      expect(result3.newAvailableClipAreas).toHaveLength(1);
      expect(result3.newAvailableClipAreas).toEqual([[2, 1]]);
    });

    test('floating point numbers cases works correctly', () => {
      const currentAvailableClipAreas = [[1.5, 0]];

      const castedTile = { ceilHeight: 1.5, floorHeight: 0 };
      const result = clipIntervalCalculation(currentAvailableClipAreas, castedTile);

      expect(result.newIntervalsForCastedTile).toEqual([[1.5, 0]]);
      expect(result.newAvailableClipAreas).toHaveLength(0);
      expect(result.newAvailableClipAreas).toEqual([]);

      const castedTile2 = { ceilHeight: 1.5, floorHeight: .5 };

      const result2 = clipIntervalCalculation(currentAvailableClipAreas, castedTile2);
      expect(result2.newIntervalsForCastedTile).toEqual([[1.5, .5]]);
      expect(result2.newAvailableClipAreas).toHaveLength(1);
      expect(result2.newAvailableClipAreas).toEqual([[.5, 0]]);

      const castedTile3 = { ceilHeight: 1.5, floorHeight: -1 };

      const result3 = clipIntervalCalculation(currentAvailableClipAreas, castedTile3);
      expect(result3.newIntervalsForCastedTile).toEqual([[1.5, 0]]);
      expect(result3.newAvailableClipAreas).toHaveLength(0);
      expect(result3.newAvailableClipAreas).toEqual([]);


      const castedTile4 = { ceilHeight: 1.2, floorHeight: 0 };
      const result4 = clipIntervalCalculation(currentAvailableClipAreas, castedTile4);

      expect(result4.newIntervalsForCastedTile).toEqual([[1.2, 0]]);
      expect(result4.newAvailableClipAreas).toHaveLength(1);
      expect(result4.newAvailableClipAreas).toEqual([[1.5, 1.2]]);

      const castedTile5 = { ceilHeight: 1.2, floorHeight: .5 };

      const result5 = clipIntervalCalculation(currentAvailableClipAreas, castedTile5);
      expect(result5.newIntervalsForCastedTile).toEqual([[1.2, .5]]);
      expect(result5.newAvailableClipAreas).toHaveLength(2);
      expect(result5.newAvailableClipAreas).toEqual([[1.5, 1.2], [.5, 0]]);

      const castedTile6 = { ceilHeight: 1.2, floorHeight: -1 };

      const result6 = clipIntervalCalculation(currentAvailableClipAreas, castedTile6);
      expect(result6.newIntervalsForCastedTile).toEqual([[1.2, 0]]);
      expect(result6.newAvailableClipAreas).toHaveLength(1);
      expect(result6.newAvailableClipAreas).toEqual([[1.5, 1.2]]);


      const castedTile7 = { ceilHeight: 1.6, floorHeight: 0 };
      const result7 = clipIntervalCalculation(currentAvailableClipAreas, castedTile7);

      expect(result7.newIntervalsForCastedTile).toEqual([[1.5, 0]]);
      expect(result7.newAvailableClipAreas).toHaveLength(0);
      expect(result7.newAvailableClipAreas).toEqual([]);

      const castedTile8 = { ceilHeight: 1.6, floorHeight: .5 };

      const result8 = clipIntervalCalculation(currentAvailableClipAreas, castedTile8);
      expect(result8.newIntervalsForCastedTile).toEqual([[1.5, .5]]);
      expect(result8.newAvailableClipAreas).toHaveLength(1);
      expect(result8.newAvailableClipAreas).toEqual([[.5, 0]]);

      const castedTile9 = { ceilHeight: 1.6, floorHeight: -1 };

      const result9 = clipIntervalCalculation(currentAvailableClipAreas, castedTile9);
      expect(result9.newIntervalsForCastedTile).toEqual([[1.5, 0]]);
      expect(result9.newAvailableClipAreas).toHaveLength(0);
      expect(result9.newAvailableClipAreas).toEqual([]);
    });

    test('castedTile is between the available clip area cases works correctly', () => {
      const currentAvailableClipAreas = [[2, 1.5], [1, 0.5]];

      const castedTile = { ceilHeight: 1, floorHeight: 0 };
      const result = clipIntervalCalculation(currentAvailableClipAreas, castedTile);

      expect(result.newIntervalsForCastedTile).toEqual([[1, 0.5]]);
      expect(result.newAvailableClipAreas).toHaveLength(1);
      expect(result.newAvailableClipAreas).toEqual([[2, 1.5]]);


      // if floorHeight is greater than the available clip area's floorHeight
      const castedTile2 = { ceilHeight: 1, floorHeight: .5 };

      const result2 = clipIntervalCalculation(currentAvailableClipAreas, castedTile2);
      expect(result2.newIntervalsForCastedTile).toEqual([[1, .5]]);
      expect(result2.newAvailableClipAreas).toHaveLength(1);
      expect(result2.newAvailableClipAreas).toEqual([[2, 1.5]]);

      // if floorHeight is lower than the available clip area's floorHeight
      const castedTile3 = { ceilHeight: 1, floorHeight: -1 };

      const result3 = clipIntervalCalculation(currentAvailableClipAreas, castedTile3);
      expect(result3.newIntervalsForCastedTile).toEqual([[1, 0.5]]);
      expect(result3.newAvailableClipAreas).toHaveLength(1);
      expect(result3.newAvailableClipAreas).toEqual([[2, 1.5]]);


      
      // if floorHeight is lower than the available clip area's floorHeight
      const castedTile4 = { ceilHeight: 1.7, floorHeight: 0.7 };

      const result4 = clipIntervalCalculation(currentAvailableClipAreas, castedTile4);
      expect(result4.newIntervalsForCastedTile).toEqual([[1.7, 1.5], [1, 0.7]]);
      expect(result4.newAvailableClipAreas).toHaveLength(2);
      expect(result4.newAvailableClipAreas).toEqual([[2, 1.7], [0.7, 0.5]]);
    });

  });


});
