import {
  getDetectedCells,
  isCellCountDoubtful,
} from '../Battery';

describe('Battery', () => {
  it('should give the cell count of a battery that is known and not doubtful', () => {
    expect(getDetectedCells({
      cellCount: 4,
      voltage: 14.71,
    })).toEqual(4);
    expect(getDetectedCells({
      cellCount: 3,
      voltage: 11.1,
    })).toEqual(3);
  });

  it('should give no cell count for a doubtful, missing or unknown battery', () => {
    expect(isCellCountDoubtful({
      cellCount: 1,
      voltage: 14.7,
    })).toBeTruthy();
    expect(getDetectedCells({
      cellCount: 1,
      voltage: 14.7,
    })).toBeNull();
    expect(getDetectedCells({
      cellCount: 0,
      voltage: 0,
    })).toBeNull();
    expect(getDetectedCells({ status: 'unknown' })).toBeNull();
    expect(getDetectedCells(null)).toBeNull();
  });
});
