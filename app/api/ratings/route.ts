// app/api/ratings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to rate movies' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { movieId, value, comment } = body;
    
    if (!movieId || typeof value !== 'number' || value < 1 || value > 5) {
      return NextResponse.json(
        { error: 'Invalid request. Required: movieId and value (1-5)' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    
    // Check if the movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });
    
    if (!movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }
    
    // Upsert the rating (create or update)
    const rating = await prisma.rating.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
      update: {
        value,
        comment,
      },
      create: {
        userId,
        movieId,
        value,
        comment,
      },
    });
    
    return NextResponse.json({ rating });
    
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json(
      { error: 'Error saving rating' },
      { status: 500 }
    );
  }
}