import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRegistry } from 'react-native'
import App from './App.js'
import './index.css'

// Register the app to extract global styles from react-native-web
AppRegistry.registerComponent('App', () => App)
const { getStyleElement } = AppRegistry.getApplication('App')

const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)

root.render(
  <React.StrictMode>
    {getStyleElement()}
    <App />
  </React.StrictMode>,
)
