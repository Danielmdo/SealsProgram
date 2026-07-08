import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

function getYouTubeId(url: string): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  const match = trimmed.match(regExp)
  return match ? match[1] : null
}

export function YouTubePlayer({ url }: { url: string }) {
  const videoId = getYouTubeId(url)
  if (!videoId) return null

  const html = `
    <html>
      <body style="margin:0;background:#000;">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1"
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </body>
    </html>
  `

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
})
