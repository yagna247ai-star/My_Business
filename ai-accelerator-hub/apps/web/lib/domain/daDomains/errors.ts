/** A problem with an uploaded dataset that the learner can fix. The message is shown to them as-is. */
export class DatasetError extends Error {
  constructor(message: string) { super(message); this.name = 'DatasetError'; }
}
