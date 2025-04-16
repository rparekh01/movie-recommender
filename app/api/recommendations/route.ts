// app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getHybridRecommendations } from '@/lib/recommendations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to get recommendations' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get recommendations for the current user
    const userId = session.user.id;
    const recommendedMovies = await getHybridRecommendations(userId, limit);
    
    // Format the response
    const formattedMovies = recommendedMovies.map(movie => ({
      ...movie,
      genres: movie.genres?.map(mg => mg.genre.name) || [],
    }));
    
    return NextResponse.json({ movies: formattedMovies });
    
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Error fetching recommendations' },
      { status: 500 }
    );
  }
}