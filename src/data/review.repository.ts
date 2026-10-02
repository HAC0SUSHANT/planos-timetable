import type { DailyReview } from '../types';
import { LocalStorageClient } from './storage';

const REVIEWS_STORAGE_KEY = 'ape_reviews_v1';

export interface IReviewRepository {
  getAll(): Promise<DailyReview[]>;
  getByDate(date: string): Promise<DailyReview | null>;
  saveReview(review: Omit<DailyReview, 'id' | 'createdAt'>): Promise<DailyReview>;
}

export class LocalReviewRepository implements IReviewRepository {
  private getReviews(): DailyReview[] {
    return LocalStorageClient.get<DailyReview[]>(REVIEWS_STORAGE_KEY, []);
  }

  private saveReviews(reviews: DailyReview[]): void {
    LocalStorageClient.set(REVIEWS_STORAGE_KEY, reviews);
  }

  async getAll(): Promise<DailyReview[]> {
    return this.getReviews().sort((a, b) => b.date.localeCompare(a.date));
  }

  async getByDate(date: string): Promise<DailyReview | null> {
    const reviews = this.getReviews();
    return reviews.find(r => r.date === date) || null;
  }

  async saveReview(review: Omit<DailyReview, 'id' | 'createdAt'>): Promise<DailyReview> {
    const reviews = this.getReviews();
    const existingIdx = reviews.findIndex(r => r.date === review.date);
    const now = new Date().toISOString();

    if (existingIdx !== -1) {
      const updated: DailyReview = {
        ...reviews[existingIdx],
        ...review,
      };
      reviews[existingIdx] = updated;
      this.saveReviews(reviews);
      return updated;
    }

    const newReview: DailyReview = {
      ...review,
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
    };
    reviews.unshift(newReview);
    this.saveReviews(reviews);
    return newReview;
  }
}
