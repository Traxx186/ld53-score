export default interface Score {
  /**
   * Unique UUID V4 string of the score.
   */
  id: string;

  /**
   * Username of the score.
   */
  username: string;

  /**
   * The score.
   */
  score: number;
}
