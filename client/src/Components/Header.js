import React, { useEffect, useState } from 'react'
import kanye from './kanye.png'

function Header() {
  return(
  <div>
    <h1>Imma Let You Finish ...</h1>
    <h3>But First Guess What Song These T-Swift Lyrics Are From</h3>
    <img src={kanye} alt="Photo of Kanye" />
  </div>
  )
}

export default Header