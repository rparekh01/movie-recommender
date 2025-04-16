// app/api/movies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the query conditions
    const where: any = {};
    
    if (genre) {
      where.genres = {
        some: {
          genre: {
            name: genre,
          },
        },
      };
    }
    
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive',
      };
    }
    
    // Get total count for pagination
    const total = await prisma.movie.count({ where });
    
    // Get the movies
    const movies = await prisma.movie.findMany({
      where,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
      orderBy: {
        releaseYear: 'desc',
      },
      skip,
      take: limit,
    });
    
    // Format the response
    const formattedMovies = movies.map(movie => ({
      ...movie,
      genres: movie.genres.map(mg => mg.genre.name),
    }));
    
    return NextResponse.json({
      movies: formattedMovies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Error fetching movies' },
      { status: 500 }
    );
  }
}