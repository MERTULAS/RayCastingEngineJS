export const RADIUS = Math.PI / 180;

export function clipIntervalCalculation(currentAvailableClipAreas, castedTile, playerHeight) {
  // returns new available clip area and new intervals for casted tile

  let newIntervalsForCastedTile = [];
  let newAvailableClipAreas = [];

  let addRemainingClipAreasAfterThatIndex = 0;
  let earlyBreak = false;

  for (let clipAreaIndex = 0; clipAreaIndex < currentAvailableClipAreas.length; clipAreaIndex++) {
    const availableClipArea = currentAvailableClipAreas[clipAreaIndex];
    if (castedTile.ceilHeight === availableClipArea[0]) {
      if (castedTile.floorHeight === availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.ceilHeight, castedTile.floorHeight]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else if (castedTile.floorHeight > availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.ceilHeight, castedTile.floorHeight]);
        newAvailableClipAreas.push([castedTile.floorHeight, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else {
        newIntervalsForCastedTile.push([castedTile.ceilHeight, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
      }
    } else if (castedTile.ceilHeight > availableClipArea[0]) {
      // Edge case maybe will be deleted in the future because it's not possible to happen
      if (castedTile.floorHeight >= availableClipArea[0]) {
        console.log('availableClipArea', availableClipArea);
        newAvailableClipAreas.push(availableClipArea);
        console.log('newAvailableClipAreas', newAvailableClipAreas);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      }

      if (castedTile.floorHeight === availableClipArea[1]) {
        newIntervalsForCastedTile.push([availableClipArea[0], castedTile.floorHeight]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else if (castedTile.floorHeight > availableClipArea[1]) {
        newIntervalsForCastedTile.push([availableClipArea[0], castedTile.floorHeight]);
        newAvailableClipAreas.push([castedTile.floorHeight, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else {
        newIntervalsForCastedTile.push([availableClipArea[0], availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
      }
    }
    else {
      if (castedTile.ceilHeight <= availableClipArea[1]) {
        newAvailableClipAreas.push(availableClipArea);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        continue;
      }

      if (castedTile.floorHeight === availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.ceilHeight, castedTile.floorHeight]);
        newAvailableClipAreas.push([availableClipArea[0], castedTile.ceilHeight]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else if (castedTile.floorHeight > availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.ceilHeight, castedTile.floorHeight]);
        newAvailableClipAreas.push([availableClipArea[0], castedTile.ceilHeight]);
        newAvailableClipAreas.push([castedTile.floorHeight, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else {
        newIntervalsForCastedTile.push([castedTile.ceilHeight, availableClipArea[1]]);
        newAvailableClipAreas.push([availableClipArea[0], castedTile.ceilHeight]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
      }
    }
      
    if (earlyBreak) {
      break;
    }
  }

  newAvailableClipAreas = [...newAvailableClipAreas, ...currentAvailableClipAreas.slice(addRemainingClipAreasAfterThatIndex + 1)];

  return { newAvailableClipAreas, newIntervalsForCastedTile };
}
