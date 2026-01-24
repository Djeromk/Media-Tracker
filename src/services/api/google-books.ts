import type { ExternalBook } from '@/types'

const BASE_URL = 'https://www.googleapis.com/books/v1'
//const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

export class BooksService {
  async searchBooks(query: string): Promise<ExternalBook[]> {
    const response = await fetch(
      `${BASE_URL}/volumes?q=${query}&printType=books&maxResults=10`
    )
    const data = await response.json()

    if (!data.items) return []

	return data.items

    // return data.items.map((item: GoogleBooksItem) => ({
    //   id: item.id,
    //   title: item.volumeInfo.title,
    //   authors: item.volumeInfo.authors || [],
    //   thumbnail: item.volumeInfo.imageLinks?.thumbnail || null,
    //   description: item.volumeInfo.description || '',
    //   pageCount: item.volumeInfo.pageCount,
    //   isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier
    // }))
  }

  async getBookDetails(id: string): Promise<ExternalBook> {
    const response = await fetch(`${BASE_URL}/volumes/${id}`)
    const item = await response.json()

    return {
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors || [],
      thumbnail: item.volumeInfo.imageLinks?.thumbnail || null,
      description: item.volumeInfo.description || '',
      pageCount: item.volumeInfo.pageCount,
      isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier
    }
  }
}

export const booksService = new BooksService()
