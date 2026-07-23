/** Ruta de la app para covers Nail Art (sin exponer Storage). Safe for client. */
export function nailArtImageApiPath(postId: string): string {
  return `/api/nail-art/image/${postId}`
}
