export type WorkerCandidate = {
  workerId: string;
  fullName: string;
  serviceName: string;
  city: string | null;
  distanceKm: number | null;
  yearsExperience: number;
  averageRating: number;
  completedJobs: number;
  isAvailable: boolean;
  skillMatch: boolean;
};

export type RankedWorker = WorkerCandidate & {
  score: number;
};

export function calculateWorkerScore(candidate: WorkerCandidate) {
  const skill = candidate.skillMatch ? 30 : 0;
  const distance = candidate.distanceKm === null ? 8 : Math.max(0, 20 - Math.min(candidate.distanceKm, 20));
  const availability = candidate.isAvailable ? 20 : 0;
  const rating = Math.min(candidate.averageRating, 5) * 3;
  const experience = Math.min(candidate.yearsExperience, 10);
  const completion = Math.min(candidate.completedJobs / 25, 5);

  return Math.round((skill + distance + availability + rating + experience + completion) * 100) / 100;
}

export function rankWorkers(candidates: WorkerCandidate[]): RankedWorker[] {
  return candidates
    .map((candidate) => ({ ...candidate, score: calculateWorkerScore(candidate) }))
    .sort((a, b) => b.score - a.score || b.averageRating - a.averageRating || b.completedJobs - a.completedJobs);
}
