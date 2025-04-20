// lib/recommendations.ts
import prisma from './prisma';
import { Movie, Prisma, Rating, User } from '@prisma/client';

/**
 * Content-based recommendation algorithm that suggests movies
 * based on genre preferences and previously highly-rated movies
 */


type MovieWithGenres = Prisma.MovieGetPayload<{
  include: {
    genres: {
      include: {
        genre: true;
      }
    }
  }
}>;

export async function getRecommendationsForUser(userId: string, limit: number = 10): Promise<MovieWithGenres[]> {
  try {
    // Get user's genre preferences
    const userGenres = await prisma.userGenre.findMany({
      where: { userId },
      include: { genre: true },
    });

    const genreIds = userGenres.map(ug => ug.genreId);

    // Get user's highly rated movies (4-5 stars)
    const userRatings = await prisma.rating.findMany({
      where: { 
        userId,
        value: { gte: 4 } // 4 stars or higher
      },
      include: { movie: { include: { genres: { include: { genre: true } } } } },
    });

    // Get the genres of movies the user has highly rated
    const ratedMovieGenres = new Set<string>();
    userRatings.forEach(rating => {
      rating.movie.genres.forEach(mg => {
        ratedMovieGenres.add(mg.genreId);
      });
    });

    // Combine explicit preferences with implicit preferences from ratings
    const allPreferredGenreIds = [...new Set([...genreIds, ...Array.from(ratedMovieGenres)])];

    // Get movies that match the user's genre preferences
    // but haven't been rated by the user yet
    const ratedMovieIds = userRatings.map(r => r.movieId);
    
    const recommendedMovies = await prisma.movie.findMany({
      where: {
        genres: {
          some: {
            genreId: { in: allPreferredGenreIds },
          },
        },
        id: {
          notIn: ratedMovieIds, // Exclude already rated movies
        },
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
      // Order by release year (newer first) as a simple heuristic
      orderBy: {
        releaseYear: 'desc',
      },
      take: limit,
    });

    return recommendedMovies;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Collaborative filtering algorithm that finds similar users
 * and recommends movies they rated highly
 */
export async function getCollaborativeRecommendations(userId: string, limit: number = 10): Promise<MovieWithGenres[]> {
  try {
    // Get all ratings by this user
    const userRatings = await prisma.rating.findMany({
      where: { userId },
    });

    // If the user hasn't rated any movies, we can't do collaborative filtering
    if (userRatings.length === 0) {
      return [];
    }

    // Find users who rated the same movies as our target user
    const ratedMovieIds = userRatings.map(r => r.movieId);
    
    const similarUsers = await prisma.user.findMany({
      where: {
        id: { not: userId }, // Exclude the current user
        ratings: {
          some: {
            movieId: { in: ratedMovieIds },
          },
        },
      },
      include: {
        ratings: {
          where: {
            movieId: { in: ratedMovieIds },
          },
        },
      },
    });

    // Calculate similarity scores between users
    // using a simple Jaccard similarity on movie overlaps
    const userSimilarities: { userId: string; score: number }[] = [];
    
    for (const otherUser of similarUsers) {
      const otherUserRatedMovies = new Set(otherUser.ratings.map(r => r.movieId));
      
      // Calculate Jaccard similarity (intersection / union)
      const intersection = ratedMovieIds.filter(id => otherUserRatedMovies.has(id)).length;
      const union = new Set([...ratedMovieIds, ...otherUserRatedMovies]).size;
      
      const similarity = intersection / union;
      
      userSimilarities.push({
        userId: otherUser.id,
        score: similarity,
      });
    }

    // Sort by similarity score (descending)
    userSimilarities.sort((a, b) => b.score - a.score);

    // Take the top 5 most similar users
    const topSimilarUserIds = userSimilarities
      .slice(0, 5)
      .map(u => u.userId);

    // Find movies highly rated by similar users that our target user hasn't rated yet
    const recommendedMovies = await prisma.movie.findMany({
      where: {
        ratings: {
          some: {
            userId: { in: topSimilarUserIds },
            value: { gte: 4 }, // 4 stars or higher
          },
          none: {
            userId, // Exclude movies already rated by our user
          },
        },
      },
      include:{
        genres:{
          include:{
            genre:true
          },
        },
      },
      distinct: ['id'],
      orderBy: [
        { releaseYear: 'desc' },
      ],
      take: limit,
    });

    return recommendedMovies;
  } catch (error) {
    console.error('Error generating collaborative recommendations:', error);
    return [];
  }
}

/**
 * Hybrid recommendation algorithm that combines 
 * content-based and collaborative filtering
 */
export async function getHybridRecommendations(userId: string, limit: number = 10): Promise<MovieWithGenres[]> {
  try {
    // Get recommendations from both approaches
    const contentBasedRecs = await getRecommendationsForUser(userId, limit);
    const collaborativeRecs = await getCollaborativeRecommendations(userId, limit);

    // Simple hybrid approach: combine and deduplicate
    const allRecommendations = [...contentBasedRecs, ...collaborativeRecs];
    const uniqueRecommendations = Array.from(
      new Map(allRecommendations.map(movie => [movie.id, movie])).values()
    );

    // Return the top recommendations up to the limit
    return uniqueRecommendations.slice(0, limit);
  } catch (error) {
    console.error('Error generating hybrid recommendations:', error);
    return [];
  }
}