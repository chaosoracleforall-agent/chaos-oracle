(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,9361,e=>{"use strict";let t=BigInt(0x100000000-1),r=BigInt(32);function o(e,n=!1){let a=e.length,s=new Uint32Array(a),i=new Uint32Array(a);for(let o=0;o<a;o++){let{h:a,l}=function(e,o=!1){return o?{h:Number(e&t),l:Number(e>>r&t)}:{h:0|Number(e>>r&t),l:0|Number(e&t)}}(e[o],n);[s[o],i[o]]=[a,l]}return[s,i]}let n=(e,t,r)=>e>>>r,a=(e,t,r)=>e<<32-r|t>>>r,s=(e,t,r)=>e>>>r|t<<32-r,i=(e,t,r)=>e<<32-r|t>>>r,l=(e,t,r)=>e<<64-r|t>>>r-32,c=(e,t,r)=>e>>>r-32|t<<64-r,p=(e,t,r)=>e<<r|t>>>32-r,u=(e,t,r)=>t<<r|e>>>32-r,h=(e,t,r)=>t<<r-32|e>>>64-r,d=(e,t,r)=>e<<r-32|t>>>64-r;function m(e,t,r,o){let n=(t>>>0)+(o>>>0);return{h:e+r+(n/0x100000000|0)|0,l:0|n}}let y=(e,t,r)=>(e>>>0)+(t>>>0)+(r>>>0),f=(e,t,r,o)=>t+r+o+(e/0x100000000|0)|0,w=(e,t,r,o)=>(e>>>0)+(t>>>0)+(r>>>0)+(o>>>0),b=(e,t,r,o,n)=>t+r+o+n+(e/0x100000000|0)|0,g=(e,t,r,o,n)=>(e>>>0)+(t>>>0)+(r>>>0)+(o>>>0)+(n>>>0),k=(e,t,r,o,n,a)=>t+r+o+n+a+(e/0x100000000|0)|0;e.s(["add",()=>m,"add3H",()=>f,"add3L",()=>y,"add4H",()=>b,"add4L",()=>w,"add5H",()=>k,"add5L",()=>g,"rotlBH",()=>h,"rotlBL",()=>d,"rotlSH",()=>p,"rotlSL",()=>u,"rotrBH",()=>l,"rotrBL",()=>c,"rotrSH",()=>s,"rotrSL",()=>i,"shrSH",()=>n,"shrSL",()=>a,"split",()=>o])},70525,e=>{"use strict";let t="object"==typeof globalThis&&"crypto"in globalThis?globalThis.crypto:void 0;function r(e){if(!Number.isSafeInteger(e)||e<0)throw Error("positive integer expected, got "+e)}function o(e,...t){if(!(e instanceof Uint8Array||ArrayBuffer.isView(e)&&"Uint8Array"===e.constructor.name))throw Error("Uint8Array expected");if(t.length>0&&!t.includes(e.length))throw Error("Uint8Array expected of length "+t+", got length="+e.length)}function n(e){if("function"!=typeof e||"function"!=typeof e.create)throw Error("Hash should be wrapped by utils.createHasher");r(e.outputLen),r(e.blockLen)}function a(e,t=!0){if(e.destroyed)throw Error("Hash instance has been destroyed");if(t&&e.finished)throw Error("Hash#digest() has already been called")}function s(e,t){o(e);let r=t.outputLen;if(e.length<r)throw Error("digestInto() expects output buffer of length at least "+r)}function i(e){return new Uint32Array(e.buffer,e.byteOffset,Math.floor(e.byteLength/4))}function l(...e){for(let t=0;t<e.length;t++)e[t].fill(0)}function c(e){return new DataView(e.buffer,e.byteOffset,e.byteLength)}function p(e,t){return e<<32-t|e>>>t}let u=68===new Uint8Array(new Uint32Array([0x11223344]).buffer)[0]?e=>e:function(e){for(let r=0;r<e.length;r++){var t;e[r]=(t=e[r])<<24&0xff000000|t<<8&0xff0000|t>>>8&65280|t>>>24&255}return e};function h(e){return"string"==typeof e&&(e=function(e){if("string"!=typeof e)throw Error("string expected");return new Uint8Array(new TextEncoder().encode(e))}(e)),o(e),e}function d(...e){let t=0;for(let r=0;r<e.length;r++){let n=e[r];o(n),t+=n.length}let r=new Uint8Array(t);for(let t=0,o=0;t<e.length;t++){let n=e[t];r.set(n,o),o+=n.length}return r}class m{}function y(e){let t=t=>e().update(h(t)).digest(),r=e();return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=()=>e(),t}function f(e){let t=(t,r)=>e(r).update(h(t)).digest(),r=e({});return t.outputLen=r.outputLen,t.blockLen=r.blockLen,t.create=t=>e(t),t}function w(e=32){if(t&&"function"==typeof t.getRandomValues)return t.getRandomValues(new Uint8Array(e));if(t&&"function"==typeof t.randomBytes)return Uint8Array.from(t.randomBytes(e));throw Error("crypto.getRandomValues must be defined")}e.s(["Hash",()=>m,"abytes",()=>o,"aexists",()=>a,"ahash",()=>n,"anumber",()=>r,"aoutput",()=>s,"clean",()=>l,"concatBytes",()=>d,"createHasher",()=>y,"createView",()=>c,"createXOFer",()=>f,"randomBytes",()=>w,"rotr",()=>p,"swap32IfBE",0,u,"toBytes",()=>h,"u32",()=>i],70525)},55263,e=>{"use strict";var t=`{
  "connect_wallet": {
    "label": "Connect Wallet",
    "wrong_network": {
      "label": "Wrong network"
    }
  },

  "intro": {
    "title": "What is a Wallet?",
    "description": "A wallet is used to send, receive, store, and display digital assets. It's also a new way to log in, without needing to create new accounts and passwords on every website.",
    "digital_asset": {
      "title": "A Home for your Digital Assets",
      "description": "Wallets are used to send, receive, store, and display digital assets like Ethereum and NFTs."
    },
    "login": {
      "title": "A New Way to Log In",
      "description": "Instead of creating new accounts and passwords on every website, just connect your wallet."
    },
    "get": {
      "label": "Get a Wallet"
    },
    "learn_more": {
      "label": "Learn More"
    }
  },

  "sign_in": {
    "label": "Verify your account",
    "description": "To finish connecting, you must sign a message in your wallet to verify that you are the owner of this account.",
    "message": {
      "send": "Sign message",
      "preparing": "Preparing message...",
      "cancel": "Cancel",
      "preparing_error": "Error preparing message, please retry!"
    },
    "signature": {
      "waiting": "Waiting for signature...",
      "verifying": "Verifying signature...",
      "signing_error": "Error signing message, please retry!",
      "verifying_error": "Error verifying signature, please retry!",
      "oops_error": "Oops, something went wrong!"
    }
  },

  "connect": {
    "label": "Connect",
    "title": "Connect a Wallet",
    "new_to_ethereum": {
      "description": "New to Ethereum wallets?",
      "learn_more": {
        "label": "Learn More"
      }
    },
    "learn_more": {
      "label": "Learn more"
    },
    "recent": "Recent",
    "status": {
      "opening": "Opening %{wallet}...",
      "connecting": "Connecting",
      "connect_mobile": "Continue in %{wallet}",
      "not_installed": "%{wallet} is not installed",
      "not_available": "%{wallet} is not available",
      "confirm": "Confirm connection in the extension",
      "confirm_mobile": "Accept connection request in the wallet"
    },
    "secondary_action": {
      "get": {
        "description": "Don't have %{wallet}?",
        "label": "GET"
      },
      "install": {
        "label": "INSTALL"
      },
      "retry": {
        "label": "RETRY"
      }
    },
    "walletconnect": {
      "description": {
        "full": "Need the official WalletConnect modal?",
        "compact": "Need the WalletConnect modal?"
      },
      "open": {
        "label": "OPEN"
      }
    }
  },

  "connect_scan": {
    "title": "Scan with %{wallet}",
    "fallback_title": "Scan with your phone"
  },

  "connector_group": {
    "installed": "Installed",
    "recommended": "Recommended",
    "other": "Other",
    "popular": "Popular",
    "more": "More",
    "others": "Others"
  },

  "get": {
    "title": "Get a Wallet",
    "action": {
      "label": "GET"
    },
    "mobile": {
      "description": "Mobile Wallet"
    },
    "extension": {
      "description": "Browser Extension"
    },
    "mobile_and_extension": {
      "description": "Mobile Wallet and Extension"
    },
    "mobile_and_desktop": {
      "description": "Mobile and Desktop Wallet"
    },
    "looking_for": {
      "title": "Not what you're looking for?",
      "mobile": {
        "description": "Select a wallet on the main screen to get started with a different wallet provider."
      },
      "desktop": {
        "compact_description": "Select a wallet on the main screen to get started with a different wallet provider.",
        "wide_description": "Select a wallet on the left to get started with a different wallet provider."
      }
    }
  },

  "get_options": {
    "title": "Get started with %{wallet}",
    "short_title": "Get %{wallet}",
    "mobile": {
      "title": "%{wallet} for Mobile",
      "description": "Use the mobile wallet to explore the world of Ethereum.",
      "download": {
        "label": "Get the app"
      }
    },
    "extension": {
      "title": "%{wallet} for %{browser}",
      "description": "Access your wallet right from your favorite web browser.",
      "download": {
        "label": "Add to %{browser}"
      }
    },
    "desktop": {
      "title": "%{wallet} for %{platform}",
      "description": "Access your wallet natively from your powerful desktop.",
      "download": {
        "label": "Add to %{platform}"
      }
    }
  },

  "get_mobile": {
    "title": "Install %{wallet}",
    "description": "Scan with your phone to download on iOS or Android",
    "continue": {
      "label": "Continue"
    }
  },

  "get_instructions": {
    "mobile": {
      "connect": {
        "label": "Connect"
      },
      "learn_more": {
        "label": "Learn More"
      }
    },
    "extension": {
      "refresh": {
        "label": "Refresh"
      },
      "learn_more": {
        "label": "Learn More"
      }
    },
    "desktop": {
      "connect": {
        "label": "Connect"
      },
      "learn_more": {
        "label": "Learn More"
      }
    }
  },

  "chains": {
    "title": "Switch Networks",
    "wrong_network": "Wrong network detected, switch or disconnect to continue.",
    "confirm": "Confirm in Wallet",
    "switching_not_supported": "Your wallet does not support switching networks from %{appName}. Try switching networks from within your wallet instead.",
    "switching_not_supported_fallback": "Your wallet does not support switching networks from this app. Try switching networks from within your wallet instead.",
    "disconnect": "Disconnect",
    "connected": "Connected"
  },

  "profile": {
    "disconnect": {
      "label": "Disconnect"
    },
    "copy_address": {
      "label": "Copy Address",
      "copied": "Copied!"
    },
    "explorer": {
      "label": "View more on explorer"
    },
    "transactions": {
      "description": "%{appName} transactions will appear here...",
      "description_fallback": "Your transactions will appear here...",
      "recent": {
        "title": "Recent Transactions"
      },
      "clear": {
        "label": "Clear All"
      }
    }
  },

  "wallet_connectors": {
    "ready": {
      "qr_code": {
        "step1": {
          "description": "Add Ready to your home screen for faster access to your wallet.",
          "title": "Open the Ready app"
        },
        "step2": {
          "description": "Create a wallet and username, or import an existing wallet.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the Scan QR button"
        }
      }
    },

    "berasig": {
      "extension": {
        "step1": {
          "title": "Install the BeraSig extension",
          "description": "We recommend pinning BeraSig to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "best": {
      "qr_code": {
        "step1": {
          "title": "Open the Best Wallet app",
          "description": "Add Best Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "bifrost": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Bifrost Wallet on your home screen for quicker access.",
          "title": "Open the Bifrost Wallet app"
        },
        "step2": {
          "description": "Create or import a wallet using your recovery phrase.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      }
    },

    "bitget": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Bitget Wallet on your home screen for quicker access.",
          "title": "Open the Bitget Wallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Bitget Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Bitget Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "bitski": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Bitski to your taskbar for quicker access to your wallet.",
          "title": "Install the Bitski extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "bitverse": {
      "qr_code": {
        "step1": {
          "title": "Open the Bitverse Wallet app",
          "description": "Add Bitverse Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "bloom": {
      "desktop": {
        "step1": {
          "title": "Open the Bloom Wallet app",
          "description": "We recommend putting Bloom Wallet on your home screen for quicker access."
        },
        "step2": {
          "description": "Create or import a wallet using your recovery phrase.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you have a wallet, click on Connect to connect via Bloom. A connection prompt in the app will appear for you to confirm the connection.",
          "title": "Click on Connect"
        }
      }
    },

    "bybit": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Bybit on your home screen for faster access to your wallet.",
          "title": "Open the Bybit app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "Click at the top right of your browser and pin Bybit Wallet for easy access.",
          "title": "Install the Bybit Wallet extension"
        },
        "step2": {
          "description": "Create a new wallet or import an existing one.",
          "title": "Create or Import a wallet"
        },
        "step3": {
          "description": "Once you set up Bybit Wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "binance": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Binance on your home screen for faster access to your wallet.",
          "title": "Open the Binance app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      },
      "extension": {
        "step1": {
          "title": "Install the Binance Wallet extension",
          "description": "We recommend pinning Binance Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "coin98": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Coin98 Wallet on your home screen for faster access to your wallet.",
          "title": "Open the Coin98 Wallet app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      },

      "extension": {
        "step1": {
          "description": "Click at the top right of your browser and pin Coin98 Wallet for easy access.",
          "title": "Install the Coin98 Wallet extension"
        },
        "step2": {
          "description": "Create a new wallet or import an existing one.",
          "title": "Create or Import a wallet"
        },
        "step3": {
          "description": "Once you set up Coin98 Wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "coinbase": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Coinbase Wallet on your home screen for quicker access.",
          "title": "Open the Coinbase Wallet app"
        },
        "step2": {
          "description": "You can easily backup your wallet using the cloud backup feature.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Coinbase Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Coinbase Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "compass": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Compass Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Compass Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "core": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Core on your home screen for faster access to your wallet.",
          "title": "Open the Core app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Core to your taskbar for quicker access to your wallet.",
          "title": "Install the Core extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "fox": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting FoxWallet on your home screen for quicker access.",
          "title": "Open the FoxWallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      }
    },

    "frontier": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Frontier Wallet on your home screen for quicker access.",
          "title": "Open the Frontier Wallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Frontier Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Frontier Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "im_token": {
      "qr_code": {
        "step1": {
          "title": "Open the imToken app",
          "description": "Put imToken app on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap Scanner Icon in top right corner",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "iopay": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting ioPay on your home screen for faster access to your wallet.",
          "title": "Open the ioPay app"
        },
        "step2": {
          "description": "You can easily backup your wallet using our backup feature on your phone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the WalletConnect button"
        }
      }
    },

    "kaikas": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Kaikas to your taskbar for quicker access to your wallet.",
          "title": "Install the Kaikas extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the Kaikas app",
          "description": "Put Kaikas app on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap Scanner Icon in top right corner",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "kaia": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Kaia to your taskbar for quicker access to your wallet.",
          "title": "Install the Kaia extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the Kaia app",
          "description": "Put Kaia app on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap Scanner Icon in top right corner",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "kraken": {
      "qr_code": {
        "step1": {
          "title": "Open the Kraken Wallet app",
          "description": "Add Kraken Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "kresus": {
      "qr_code": {
        "step1": {
          "title": "Open the Kresus Wallet app",
          "description": "Add Kresus Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "magicEden": {
      "extension": {
        "step1": {
          "title": "Install the Magic Eden extension",
          "description": "We recommend pinning Magic Eden to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "metamask": {
      "qr_code": {
        "step1": {
          "title": "Open the MetaMask app",
          "description": "We recommend putting MetaMask on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the MetaMask extension",
          "description": "We recommend pinning MetaMask to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "nestwallet": {
      "extension": {
        "step1": {
          "title": "Install the NestWallet extension",
          "description": "We recommend pinning NestWallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "okx": {
      "qr_code": {
        "step1": {
          "title": "Open the OKX Wallet app",
          "description": "We recommend putting OKX Wallet on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the OKX Wallet extension",
          "description": "We recommend pinning OKX Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "omni": {
      "qr_code": {
        "step1": {
          "title": "Open the Omni app",
          "description": "Add Omni to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your home screen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "1inch": {
      "qr_code": {
        "step1": {
          "description": "Put 1inch Wallet on your home screen for faster access to your wallet.",
          "title": "Open the 1inch Wallet app"
        },
        "step2": {
          "description": "Create a wallet and username, or import an existing wallet.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the Scan QR button"
        }
      }
    },

    "token_pocket": {
      "qr_code": {
        "step1": {
          "title": "Open the TokenPocket app",
          "description": "We recommend putting TokenPocket on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the TokenPocket extension",
          "description": "We recommend pinning TokenPocket to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "trust": {
      "qr_code": {
        "step1": {
          "title": "Open the Trust Wallet app",
          "description": "Put Trust Wallet on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap WalletConnect in Settings",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the Trust Wallet extension",
          "description": "Click at the top right of your browser and pin Trust Wallet for easy access."
        },
        "step2": {
          "title": "Create or Import a wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up Trust Wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "uniswap": {
      "qr_code": {
        "step1": {
          "title": "Open the Uniswap app",
          "description": "Add Uniswap Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "zerion": {
      "qr_code": {
        "step1": {
          "title": "Open the Zerion app",
          "description": "We recommend putting Zerion on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },

      "extension": {
        "step1": {
          "title": "Install the Zerion extension",
          "description": "We recommend pinning Zerion to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "rainbow": {
      "qr_code": {
        "step1": {
          "title": "Open the Rainbow app",
          "description": "We recommend putting Rainbow on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "You can easily backup your wallet using our backup feature on your phone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "enkrypt": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Enkrypt Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Enkrypt Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "frame": {
      "extension": {
        "step1": {
          "description": "We recommend pinning Frame to your taskbar for quicker access to your wallet.",
          "title": "Install Frame & the companion extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "one_key": {
      "extension": {
        "step1": {
          "title": "Install the OneKey Wallet extension",
          "description": "We recommend pinning OneKey Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "paraswap": {
      "qr_code": {
        "step1": {
          "title": "Open the ParaSwap app",
          "description": "Add ParaSwap Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      }
    },

    "phantom": {
      "extension": {
        "step1": {
          "title": "Install the Phantom extension",
          "description": "We recommend pinning Phantom to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "rabby": {
      "extension": {
        "step1": {
          "title": "Install the Rabby extension",
          "description": "We recommend pinning Rabby to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "ronin": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting Ronin Wallet on your home screen for quicker access.",
          "title": "Open the Ronin Wallet app"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      },

      "extension": {
        "step1": {
          "description": "We recommend pinning Ronin Wallet to your taskbar for quicker access to your wallet.",
          "title": "Install the Ronin Wallet extension"
        },
        "step2": {
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension.",
          "title": "Refresh your browser"
        }
      }
    },

    "ramper": {
      "extension": {
        "step1": {
          "title": "Install the Ramper extension",
          "description": "We recommend pinning Ramper to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "safeheron": {
      "extension": {
        "step1": {
          "title": "Install the Core extension",
          "description": "We recommend pinning Safeheron to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "taho": {
      "extension": {
        "step1": {
          "title": "Install the Taho extension",
          "description": "We recommend pinning Taho to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "wigwam": {
      "extension": {
        "step1": {
          "title": "Install the Wigwam extension",
          "description": "We recommend pinning Wigwam to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "talisman": {
      "extension": {
        "step1": {
          "title": "Install the Talisman extension",
          "description": "We recommend pinning Talisman to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import an Ethereum Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "ctrl": {
      "extension": {
        "step1": {
          "title": "Install the CTRL Wallet extension",
          "description": "We recommend pinning CTRL Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "zeal": {
      "qr_code": {
        "step1": {
          "title": "Open the Zeal app",
          "description": "Add Zeal Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the QR icon and scan",
          "description": "Tap the QR icon on your homescreen, scan the code and confirm the prompt to connect."
        }
      },
      "extension": {
        "step1": {
          "title": "Install the Zeal extension",
          "description": "We recommend pinning Zeal to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "safepal": {
      "extension": {
        "step1": {
          "title": "Install the SafePal Wallet extension",
          "description": "Click at the top right of your browser and pin SafePal Wallet for easy access."
        },
        "step2": {
          "title": "Create or Import a wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up SafePal Wallet, click below to refresh the browser and load up the extension."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the SafePal Wallet app",
          "description": "Put SafePal Wallet on your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap WalletConnect in Settings",
          "description": "Choose New Connection, then scan the QR code and confirm the prompt to connect."
        }
      }
    },

    "desig": {
      "extension": {
        "step1": {
          "title": "Install the Desig extension",
          "description": "We recommend pinning Desig to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "subwallet": {
      "extension": {
        "step1": {
          "title": "Install the SubWallet extension",
          "description": "We recommend pinning SubWallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the SubWallet app",
          "description": "We recommend putting SubWallet on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "clv": {
      "extension": {
        "step1": {
          "title": "Install the CLV Wallet extension",
          "description": "We recommend pinning CLV Wallet to your taskbar for quicker access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the CLV Wallet app",
          "description": "We recommend putting CLV Wallet on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret phrase with anyone."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "okto": {
      "qr_code": {
        "step1": {
          "title": "Open the Okto app",
          "description": "Add Okto to your home screen for quick access"
        },
        "step2": {
          "title": "Create an MPC Wallet",
          "description": "Create an account and generate a wallet"
        },
        "step3": {
          "title": "Tap WalletConnect in Settings",
          "description": "Tap the Scan QR icon at the top right and confirm the prompt to connect."
        }
      }
    },

    "ledger": {
      "desktop": {
        "step1": {
          "title": "Open the Ledger Live app",
          "description": "We recommend putting Ledger Live on your home screen for quicker access."
        },
        "step2": {
          "title": "Set up your Ledger",
          "description": "Set up a new Ledger or connect to an existing one."
        },
        "step3": {
          "title": "Connect",
          "description": "A connection prompt will appear for you to connect your wallet."
        }
      },
      "qr_code": {
        "step1": {
          "title": "Open the Ledger Live app",
          "description": "We recommend putting Ledger Live on your home screen for quicker access."
        },
        "step2": {
          "title": "Set up your Ledger",
          "description": "You can either sync with the desktop app or connect your Ledger."
        },
        "step3": {
          "title": "Scan the code",
          "description": "Tap WalletConnect then Switch to Scanner. After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "valora": {
      "qr_code": {
        "step1": {
          "title": "Open the Valora app",
          "description": "We recommend putting Valora on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or import a wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "gate": {
      "qr_code": {
        "step1": {
          "title": "Open the Gate app",
          "description": "We recommend putting Gate on your home screen for quicker access."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      },
      "extension": {
        "step1": {
          "title": "Install the Gate extension",
          "description": "We recommend pinning Gate to your taskbar for easier access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Be sure to back up your wallet using a secure method. Never share your secret recovery phrase with anyone."
        },
        "step3": {
          "title": "Refresh your browser",
          "description": "Once you set up your wallet, click below to refresh the browser and load up the extension."
        }
      }
    },

    "gemini": {
      "qr_code": {
        "step1": {
          "title": "Open keys.gemini.com",
          "description": "Visit keys.gemini.com on your mobile browser - no app download required."
        },
        "step2": {
          "title": "Create Your Wallet Instantly",
          "description": "Set up your smart wallet in seconds using your device's built-in authentication."
        },
        "step3": {
          "title": "Scan to Connect",
          "description": "Scan the QR code to instantly connect your wallet - it just works."
        }
      },
      "extension": {
        "step1": {
          "title": "Go to keys.gemini.com",
          "description": "No extensions or downloads needed - your wallet lives securely in the browser."
        },
        "step2": {
          "title": "One-Click Setup",
          "description": "Create your smart wallet instantly with passkey authentication - easier than any wallet out there."
        },
        "step3": {
          "title": "Connect and Go",
          "description": "Approve the connection and you're ready - the unopinionated wallet that just works."
        }
      }
    },

    "xportal": {
      "qr_code": {
        "step1": {
          "description": "Put xPortal on your home screen for faster access to your wallet.",
          "title": "Open the xPortal app"
        },
        "step2": {
          "description": "Create a wallet or import an existing one.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the Scan QR button"
        }
      }
    },

    "mew": {
      "qr_code": {
        "step1": {
          "description": "We recommend putting MEW Wallet on your home screen for quicker access.",
          "title": "Open the MEW Wallet app"
        },
        "step2": {
          "description": "You can easily backup your wallet using the cloud backup feature.",
          "title": "Create or Import a Wallet"
        },
        "step3": {
          "description": "After you scan, a connection prompt will appear for you to connect your wallet.",
          "title": "Tap the scan button"
        }
      }
    },

    "zilpay": {
      "qr_code": {
        "step1": {
          "title": "Open the ZilPay app",
          "description": "Add ZilPay to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    },

    "nova": {
      "qr_code": {
        "step1": {
          "title": "Open the Nova Wallet app",
          "description": "Add Nova Wallet to your home screen for faster access to your wallet."
        },
        "step2": {
          "title": "Create or Import a Wallet",
          "description": "Create a new wallet or import an existing one."
        },
        "step3": {
          "title": "Tap the scan button",
          "description": "After you scan, a connection prompt will appear for you to connect your wallet."
        }
      }
    }
  }
}
`;e.s(["en_US_default",()=>t])},96923,e=>{"use strict";var t=e.i(43476),r=e.i(71645),o=e.i(22652),n=e.i(3111),a=e.i(74983),s=e.i(10163),i=e.i(50323),l=e.i(57874),c=e.i(82191),p=e.i(39080);let u={block:(0,l.defineBlock)({format:e=>({transactions:e.transactions?.map(e=>{if("string"==typeof e)return e;let t=(0,c.formatTransaction)(e);return"0x7e"===t.typeHex&&(t.isSystemTx=e.isSystemTx,t.mint=e.mint?(0,i.hexToBigInt)(e.mint):void 0,t.sourceHash=e.sourceHash,t.type="deposit"),t}),stateRoot:e.stateRoot})}),transaction:(0,c.defineTransaction)({format(e){let t={};return"0x7e"===e.type&&(t.isSystemTx=e.isSystemTx,t.mint=e.mint?(0,i.hexToBigInt)(e.mint):void 0,t.sourceHash=e.sourceHash,t.type="deposit"),t}}),transactionReceipt:(0,p.defineTransactionReceipt)({format:e=>({l1GasPrice:e.l1GasPrice?(0,i.hexToBigInt)(e.l1GasPrice):null,l1GasUsed:e.l1GasUsed?(0,i.hexToBigInt)(e.l1GasUsed):null,l1Fee:e.l1Fee?(0,i.hexToBigInt)(e.l1Fee):null,l1FeeScalar:e.l1FeeScalar?Number(e.l1FeeScalar):null})})};var h=e.i(8861),d=e.i(96516),m=e.i(47526),y=e.i(75107),f=e.i(70326),w=e.i(93702),b=e.i(94371),g=e.i(49810),k=e.i(83031),x=e.i(10538),v=e.i(8406),C=e.i(56047),W=e.i(74768),I=e.i(69934),P=e.i(86741),T=e.i(5880),O=e.i(53532),q=e.i(1319),B=e.i(90063);function A(e){let{chainId:t,maxPriorityFeePerGas:r,maxFeePerGas:o,to:n}=e;if(t<=0)throw new T.InvalidChainIdError({chainId:t});if(n&&!(0,d.isAddress)(n))throw new h.InvalidAddressError({address:n});if(o&&o>W.maxUint256)throw new O.FeeCapTooHighError({maxFeePerGas:o});if(r&&o&&r>o)throw new O.TipAboveFeeCapError({maxFeePerGas:o,maxPriorityFeePerGas:r})}var R=e.i(76213);function _(e){if(!e||0===e.length)return[];let t=[];for(let r=0;r<e.length;r++){let{address:o,storageKeys:n}=e[r];for(let e=0;e<n.length;e++)if(n[e].length-2!=64)throw new w.InvalidStorageKeySizeError({storageKey:n[e]});if(!(0,d.isAddress)(o,{strict:!1}))throw new h.InvalidAddressError({address:o});t.push([o,n])}return t}function j(e,t){let r=t??e,{v:o,yParity:n}=r;if(void 0===r.r||void 0===r.s||void 0===o&&void 0===n)return[];let a=(0,v.trim)(r.r),s=(0,v.trim)(r.s);return["number"==typeof n?n?(0,y.numberToHex)(1):"0x":0n===o?"0x":1n===o?(0,y.numberToHex)(1):27n===o?"0x":(0,y.numberToHex)(1),"0x00"===a?"0x":a,"0x00"===s?"0x":s]}let H={blockTime:2e3,contracts:{gasPriceOracle:{address:"0x420000000000000000000000000000000000000F"},l1Block:{address:"0x4200000000000000000000000000000000000015"},l2CrossDomainMessenger:{address:"0x4200000000000000000000000000000000000007"},l2Erc721Bridge:{address:"0x4200000000000000000000000000000000000014"},l2StandardBridge:{address:"0x4200000000000000000000000000000000000010"},l2ToL1MessagePasser:{address:"0x4200000000000000000000000000000000000016"}},formatters:u,serializers:{transaction:function(e,t){var r;let o;return"deposit"===(r=e).type||void 0!==r.sourceHash?function(e){!function(e){let{from:t,to:r}=e;if(t&&!(0,d.isAddress)(t))throw new h.InvalidAddressError({address:t});if(r&&!(0,d.isAddress)(r))throw new h.InvalidAddressError({address:r})}(e);let{sourceHash:t,data:r,from:o,gas:n,isSystemTx:a,mint:s,to:i,value:l}=e,c=[t,o,i??"0x",s?(0,y.toHex)(s):"0x",l?(0,y.toHex)(l):"0x",n?(0,y.toHex)(n):"0x",a?"0x1":"0x",r??"0x"];return(0,m.concatHex)(["0x7e",(0,f.toRlp)(c)])}(e):"eip1559"===(o=(0,R.getTransactionType)(e))?function(e,t){let{chainId:r,gas:o,nonce:n,to:a,value:s,maxFeePerGas:i,maxPriorityFeePerGas:l,accessList:c,data:p}=e;A(e);let u=_(c),h=[(0,y.numberToHex)(r),n?(0,y.numberToHex)(n):"0x",l?(0,y.numberToHex)(l):"0x",i?(0,y.numberToHex)(i):"0x",o?(0,y.numberToHex)(o):"0x",a??"0x",s?(0,y.numberToHex)(s):"0x",p??"0x",u,...j(e,t)];return(0,m.concatHex)(["0x02",(0,f.toRlp)(h)])}(e,t):"eip2930"===o?function(e,t){let{chainId:r,gas:o,data:n,nonce:a,to:s,value:i,accessList:l,gasPrice:c}=e;!function(e){let{chainId:t,maxPriorityFeePerGas:r,gasPrice:o,maxFeePerGas:n,to:a}=e;if(t<=0)throw new T.InvalidChainIdError({chainId:t});if(a&&!(0,d.isAddress)(a))throw new h.InvalidAddressError({address:a});if(r||n)throw new I.BaseError("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid EIP-2930 Transaction attribute.");if(o&&o>W.maxUint256)throw new O.FeeCapTooHighError({maxFeePerGas:o})}(e);let p=_(l),u=[(0,y.numberToHex)(r),a?(0,y.numberToHex)(a):"0x",c?(0,y.numberToHex)(c):"0x",o?(0,y.numberToHex)(o):"0x",s??"0x",i?(0,y.numberToHex)(i):"0x",n??"0x",p,...j(e,t)];return(0,m.concatHex)(["0x01",(0,f.toRlp)(u)])}(e,t):"eip4844"===o?function(e,t){let{chainId:r,gas:o,nonce:n,to:a,value:s,maxFeePerBlobGas:l,maxFeePerGas:c,maxPriorityFeePerGas:p,accessList:u,data:h}=e;!function(e){let{blobVersionedHashes:t}=e;if(t){if(0===t.length)throw new P.EmptyBlobError;for(let e of t){let t=(0,q.size)(e),r=(0,i.hexToNumber)((0,B.slice)(e,0,1));if(32!==t)throw new P.InvalidVersionedHashSizeError({hash:e,size:t});if(r!==C.versionedHashVersionKzg)throw new P.InvalidVersionedHashVersionError({hash:e,version:r})}}A(e)}(e);let d=e.blobVersionedHashes,w=e.sidecars;if(e.blobs&&(void 0===d||void 0===w)){let t="string"==typeof e.blobs[0]?e.blobs:e.blobs.map(e=>(0,y.bytesToHex)(e)),r=e.kzg,o=(0,b.blobsToCommitments)({blobs:t,kzg:r});if(void 0===d&&(d=(0,k.commitmentsToVersionedHashes)({commitments:o})),void 0===w){let e=(0,g.blobsToProofs)({blobs:t,commitments:o,kzg:r});w=(0,x.toBlobSidecars)({blobs:t,commitments:o,proofs:e})}}let v=_(u),W=[(0,y.numberToHex)(r),n?(0,y.numberToHex)(n):"0x",p?(0,y.numberToHex)(p):"0x",c?(0,y.numberToHex)(c):"0x",o?(0,y.numberToHex)(o):"0x",a??"0x",s?(0,y.numberToHex)(s):"0x",h??"0x",v,l?(0,y.numberToHex)(l):"0x",d??[],...j(e,t)],I=[],T=[],O=[];if(w)for(let e=0;e<w.length;e++){let{blob:t,commitment:r,proof:o}=w[e];I.push(t),T.push(r),O.push(o)}return(0,m.concatHex)(["0x03",w?(0,f.toRlp)([W,I,T,O]):(0,f.toRlp)(W)])}(e,t):"eip7702"===o?function(e,t){let{authorizationList:r,chainId:o,gas:n,nonce:a,to:s,value:i,maxFeePerGas:l,maxPriorityFeePerGas:c,accessList:p,data:u}=e;!function(e){let{authorizationList:t}=e;if(t)for(let e of t){let{chainId:t}=e,r=e.address;if(!(0,d.isAddress)(r))throw new h.InvalidAddressError({address:r});if(t<0)throw new T.InvalidChainIdError({chainId:t})}A(e)}(e);let w=_(p),b=function(e){if(!e||0===e.length)return[];let t=[];for(let r of e){let{chainId:e,nonce:o,...n}=r,a=r.address;t.push([e?(0,y.toHex)(e):"0x",a,o?(0,y.toHex)(o):"0x",...j({},n)])}return t}(r);return(0,m.concatHex)(["0x04",(0,f.toRlp)([(0,y.numberToHex)(o),a?(0,y.numberToHex)(a):"0x",c?(0,y.numberToHex)(c):"0x",l?(0,y.numberToHex)(l):"0x",n?(0,y.numberToHex)(n):"0x",s??"0x",i?(0,y.numberToHex)(i):"0x",u??"0x",w,b,...j(e,t)])])}(e,t):function(e,t){let{chainId:r=0,gas:o,data:n,nonce:a,to:s,value:i,gasPrice:l}=e;!function(e){let{chainId:t,maxPriorityFeePerGas:r,gasPrice:o,maxFeePerGas:n,to:a}=e;if(a&&!(0,d.isAddress)(a))throw new h.InvalidAddressError({address:a});if(void 0!==t&&t<=0)throw new T.InvalidChainIdError({chainId:t});if(r||n)throw new I.BaseError("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid Legacy Transaction attribute.");if(o&&o>W.maxUint256)throw new O.FeeCapTooHighError({maxFeePerGas:o})}(e);let c=[a?(0,y.numberToHex)(a):"0x",l?(0,y.numberToHex)(l):"0x",o?(0,y.numberToHex)(o):"0x",s??"0x",i?(0,y.numberToHex)(i):"0x",n??"0x"];if(t){let e=(()=>{if(t.v>=35n)return(t.v-35n)/2n>0?t.v:27n+(35n===t.v?0n:1n);if(r>0)return BigInt(2*r)+BigInt(35n+t.v-27n);let e=27n+(27n===t.v?0n:1n);if(t.v!==e)throw new w.InvalidLegacyVError({v:t.v});return e})(),o=(0,v.trim)(t.r),n=(0,v.trim)(t.s);c=[...c,(0,y.numberToHex)(e),"0x00"===o?"0x":o,"0x00"===n?"0x":n]}else r>0&&(c=[...c,(0,y.numberToHex)(r),"0x","0x"]);return(0,f.toRlp)(c)}(e,t)}}};var S=e.i(38463);let E=(0,S.defineChain)({...H,id:8453,name:"Base",nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18},rpcUrls:{default:{http:["https://mainnet.base.org"]}},blockExplorers:{default:{name:"Basescan",url:"https://basescan.org",apiUrl:"https://api.basescan.org/api"}},contracts:{...H.contracts,disputeGameFactory:{1:{address:"0x43edB88C4B80fDD2AdFF2412A7BebF9dF42cB40e"}},l2OutputOracle:{1:{address:"0x56315b90c40730925ec5485cf004d835058518A0"}},multicall3:{address:"0xca11bde05977b3631167028862be2a173976ca11",blockCreated:5022},portal:{1:{address:"0x49048044D57e1C92A77f79988d21Fa8fAF74E97e",blockCreated:0x10ac19f}},l1StandardBridge:{1:{address:"0x3154Cf16ccdb4C6d922629664174b904d80F2C35",blockCreated:0x10ac19f}}},sourceId:1});({...E,experimental_preconfirmationTime:200,rpcUrls:{default:{http:["https://mainnet-preconf.base.org"]}}});let N=(0,S.defineChain)({...H,id:84532,network:"base-sepolia",name:"Base Sepolia",nativeCurrency:{name:"Sepolia Ether",symbol:"ETH",decimals:18},rpcUrls:{default:{http:["https://sepolia.base.org"]}},blockExplorers:{default:{name:"Basescan",url:"https://sepolia.basescan.org",apiUrl:"https://api-sepolia.basescan.org/api"}},contracts:{...H.contracts,disputeGameFactory:{0xaa36a7:{address:"0xd6E6dBf4F7EA0ac412fD8b65ED297e64BB7a06E1"}},l2OutputOracle:{0xaa36a7:{address:"0x84457ca9D0163FbC4bbfe4Dfbb20ba46e48DF254"}},portal:{0xaa36a7:{address:"0x49f53e41452c74589e85ca1677426ba426459e85",blockCreated:4446677}},l1StandardBridge:{0xaa36a7:{address:"0xfd0Bf71F60660E2f608ed56e1659C450eB113120",blockCreated:4446677}},multicall3:{address:"0xca11bde05977b3631167028862be2a173976ca11",blockCreated:1059647}},testnet:!0,sourceId:0xaa36a7});({...N,experimental_preconfirmationTime:200,rpcUrls:{default:{http:["https://sepolia-preconf.base.org"]}}});var Q=e.i(12598),M=e.i(19273),F=e.i(86491),L=e.i(40143),D=e.i(15823),K=class extends D.Subscribable{constructor(e={}){super(),this.config=e,this.#e=new Map}#e;build(e,t,r){let o=t.queryKey,n=t.queryHash??(0,M.hashQueryKeyByOptions)(o,t),a=this.get(n);return a||(a=new F.Query({client:e,queryKey:o,queryHash:n,options:e.defaultQueryOptions(t),state:r,defaultOptions:e.getQueryDefaults(o)}),this.add(a)),a}add(e){this.#e.has(e.queryHash)||(this.#e.set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){let t=this.#e.get(e.queryHash);t&&(e.destroy(),t===e&&this.#e.delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){L.notifyManager.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return this.#e.get(e)}getAll(){return[...this.#e.values()]}find(e){let t={exact:!0,...e};return this.getAll().find(e=>(0,M.matchQuery)(t,e))}findAll(e={}){let t=this.getAll();return Object.keys(e).length>0?t.filter(t=>(0,M.matchQuery)(e,t)):t}notify(e){L.notifyManager.batch(()=>{this.listeners.forEach(t=>{t(e)})})}onFocus(){L.notifyManager.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){L.notifyManager.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}},U=e.i(14272),G=D,V=class extends G.Subscribable{constructor(e={}){super(),this.config=e,this.#t=new Set,this.#r=new Map,this.#o=0}#t;#r;#o;build(e,t,r){let o=new U.Mutation({client:e,mutationCache:this,mutationId:++this.#o,options:e.defaultMutationOptions(t),state:r});return this.add(o),o}add(e){this.#t.add(e);let t=Y(e);if("string"==typeof t){let r=this.#r.get(t);r?r.push(e):this.#r.set(t,[e])}this.notify({type:"added",mutation:e})}remove(e){if(this.#t.delete(e)){let t=Y(e);if("string"==typeof t){let r=this.#r.get(t);if(r)if(r.length>1){let t=r.indexOf(e);-1!==t&&r.splice(t,1)}else r[0]===e&&this.#r.delete(t)}}this.notify({type:"removed",mutation:e})}canRun(e){let t=Y(e);if("string"!=typeof t)return!0;{let r=this.#r.get(t),o=r?.find(e=>"pending"===e.state.status);return!o||o===e}}runNext(e){let t=Y(e);if("string"!=typeof t)return Promise.resolve();{let r=this.#r.get(t)?.find(t=>t!==e&&t.state.isPaused);return r?.continue()??Promise.resolve()}}clear(){L.notifyManager.batch(()=>{this.#t.forEach(e=>{this.notify({type:"removed",mutation:e})}),this.#t.clear(),this.#r.clear()})}getAll(){return Array.from(this.#t)}find(e){let t={exact:!0,...e};return this.getAll().find(e=>(0,M.matchMutation)(t,e))}findAll(e={}){return this.getAll().filter(t=>(0,M.matchMutation)(e,t))}notify(e){L.notifyManager.batch(()=>{this.listeners.forEach(t=>{t(e)})})}resumePausedMutations(){let e=this.getAll().filter(e=>e.state.isPaused);return L.notifyManager.batch(()=>Promise.all(e.map(e=>e.continue().catch(M.noop))))}};function Y(e){return e.options.scope?.id}var z=e.i(75555),Z=e.i(14448);function X(e){return{onFetch:(t,r)=>{let o=t.options,n=t.fetchOptions?.meta?.fetchMore?.direction,a=t.state.data?.pages||[],s=t.state.data?.pageParams||[],i={pages:[],pageParams:[]},l=0,c=async()=>{let r=!1,c=(0,M.ensureQueryFn)(t.options,t.fetchOptions),p=async(e,o,n)=>{let a;if(r)return Promise.reject();if(null==o&&e.pages.length)return Promise.resolve(e);let s=(a={client:t.client,queryKey:t.queryKey,pageParam:o,direction:n?"backward":"forward",meta:t.options.meta},(0,M.addConsumeAwareSignal)(a,()=>t.signal,()=>r=!0),a),i=await c(s),{maxPages:l}=t.options,p=n?M.addToStart:M.addToEnd;return{pages:p(e.pages,i,l),pageParams:p(e.pageParams,o,l)}};if(n&&a.length){let e="backward"===n,t={pages:a,pageParams:s},r=(e?function(e,{pages:t,pageParams:r}){return t.length>0?e.getPreviousPageParam?.(t[0],t,r[0],r):void 0}:J)(o,t);i=await p(t,r,e)}else{let t=e??a.length;do{let e=0===l?s[0]??o.initialPageParam:J(o,i);if(l>0&&null==e)break;i=await p(i,e),l++}while(l<t)}return i};t.options.persister?t.fetchFn=()=>t.options.persister?.(c,{client:t.client,queryKey:t.queryKey,meta:t.options.meta,signal:t.signal},r):t.fetchFn=c}}}function J(e,{pages:t,pageParams:r}){let o=t.length-1;return t.length>0?e.getNextPageParam(t[o],t,r[o],r):void 0}var $=class{#n;#a;#s;#i;#l;#c;#p;#u;constructor(e={}){this.#n=e.queryCache||new K,this.#a=e.mutationCache||new V,this.#s=e.defaultOptions||{},this.#i=new Map,this.#l=new Map,this.#c=0}mount(){this.#c++,1===this.#c&&(this.#p=z.focusManager.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#n.onFocus())}),this.#u=Z.onlineManager.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#n.onOnline())}))}unmount(){this.#c--,0===this.#c&&(this.#p?.(),this.#p=void 0,this.#u?.(),this.#u=void 0)}isFetching(e){return this.#n.findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return this.#a.findAll({...e,status:"pending"}).length}getQueryData(e){let t=this.defaultQueryOptions({queryKey:e});return this.#n.get(t.queryHash)?.state.data}ensureQueryData(e){let t=this.defaultQueryOptions(e),r=this.#n.build(this,t),o=r.state.data;return void 0===o?this.fetchQuery(e):(e.revalidateIfStale&&r.isStaleByTime((0,M.resolveStaleTime)(t.staleTime,r))&&this.prefetchQuery(t),Promise.resolve(o))}getQueriesData(e){return this.#n.findAll(e).map(({queryKey:e,state:t})=>[e,t.data])}setQueryData(e,t,r){let o=this.defaultQueryOptions({queryKey:e}),n=this.#n.get(o.queryHash),a=n?.state.data,s=(0,M.functionalUpdate)(t,a);if(void 0!==s)return this.#n.build(this,o).setData(s,{...r,manual:!0})}setQueriesData(e,t,r){return L.notifyManager.batch(()=>this.#n.findAll(e).map(({queryKey:e})=>[e,this.setQueryData(e,t,r)]))}getQueryState(e){let t=this.defaultQueryOptions({queryKey:e});return this.#n.get(t.queryHash)?.state}removeQueries(e){let t=this.#n;L.notifyManager.batch(()=>{t.findAll(e).forEach(e=>{t.remove(e)})})}resetQueries(e,t){let r=this.#n;return L.notifyManager.batch(()=>(r.findAll(e).forEach(e=>{e.reset()}),this.refetchQueries({type:"active",...e},t)))}cancelQueries(e,t={}){let r={revert:!0,...t};return Promise.all(L.notifyManager.batch(()=>this.#n.findAll(e).map(e=>e.cancel(r)))).then(M.noop).catch(M.noop)}invalidateQueries(e,t={}){return L.notifyManager.batch(()=>(this.#n.findAll(e).forEach(e=>{e.invalidate()}),e?.refetchType==="none")?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},t))}refetchQueries(e,t={}){let r={...t,cancelRefetch:t.cancelRefetch??!0};return Promise.all(L.notifyManager.batch(()=>this.#n.findAll(e).filter(e=>!e.isDisabled()&&!e.isStatic()).map(e=>{let t=e.fetch(void 0,r);return r.throwOnError||(t=t.catch(M.noop)),"paused"===e.state.fetchStatus?Promise.resolve():t}))).then(M.noop)}fetchQuery(e){let t=this.defaultQueryOptions(e);void 0===t.retry&&(t.retry=!1);let r=this.#n.build(this,t);return r.isStaleByTime((0,M.resolveStaleTime)(t.staleTime,r))?r.fetch(t):Promise.resolve(r.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(M.noop).catch(M.noop)}fetchInfiniteQuery(e){return e.behavior=X(e.pages),this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(M.noop).catch(M.noop)}ensureInfiniteQueryData(e){return e.behavior=X(e.pages),this.ensureQueryData(e)}resumePausedMutations(){return Z.onlineManager.isOnline()?this.#a.resumePausedMutations():Promise.resolve()}getQueryCache(){return this.#n}getMutationCache(){return this.#a}getDefaultOptions(){return this.#s}setDefaultOptions(e){this.#s=e}setQueryDefaults(e,t){this.#i.set((0,M.hashKey)(e),{queryKey:e,defaultOptions:t})}getQueryDefaults(e){let t=[...this.#i.values()],r={};return t.forEach(t=>{(0,M.partialMatchKey)(e,t.queryKey)&&Object.assign(r,t.defaultOptions)}),r}setMutationDefaults(e,t){this.#l.set((0,M.hashKey)(e),{mutationKey:e,defaultOptions:t})}getMutationDefaults(e){let t=[...this.#l.values()],r={};return t.forEach(t=>{(0,M.partialMatchKey)(e,t.mutationKey)&&Object.assign(r,t.defaultOptions)}),r}defaultQueryOptions(e){if(e._defaulted)return e;let t={...this.#s.queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return t.queryHash||(t.queryHash=(0,M.hashQueryKeyByOptions)(t.queryKey,t)),void 0===t.refetchOnReconnect&&(t.refetchOnReconnect="always"!==t.networkMode),void 0===t.throwOnError&&(t.throwOnError=!!t.suspense),!t.networkMode&&t.persister&&(t.networkMode="offlineFirst"),t.queryFn===M.skipToken&&(t.enabled=!1),t}defaultMutationOptions(e){return e?._defaulted?e:{...this.#s.mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){this.#n.clear(),this.#a.clear()}};let ee=(0,o.getDefaultConfig)({appName:"Chaos Oracle",projectId:"chaos-oracle-project-id",chains:[E,N],transports:{[E.id]:(0,s.http)(),[N.id]:(0,s.http)()},ssr:!0}),et=new $;function er({children:e}){let[s,i]=(0,r.useState)(!1);return((0,r.useEffect)(()=>i(!0),[]),s)?(0,t.jsx)(a.WagmiProvider,{config:ee,children:(0,t.jsx)(Q.QueryClientProvider,{client:et,children:(0,t.jsx)(o.RainbowKitProvider,{theme:(0,n.darkTheme)({accentColor:"#ff4500",accentColorForeground:"white",borderRadius:"none",fontStack:"system",overlayBlur:"small"}),children:e})})}):null}e.s(["Providers",()=>er],96923)},1139,e=>{e.v(t=>Promise.all(["static/chunks/8d2a37f99775993c.js"].map(t=>e.l(t))).then(()=>t(9963)))},89892,e=>{e.v(e=>Promise.resolve().then(()=>e(37575)))},14544,e=>{e.v(t=>Promise.all(["static/chunks/e0ed2649d3073a5e.js"].map(t=>e.l(t))).then(()=>t(64871)))},99160,e=>{e.v(t=>Promise.all(["static/chunks/ed9f5cf30bb184c0.js"].map(t=>e.l(t))).then(()=>t(52117)))},58488,e=>{e.v(t=>Promise.all(["static/chunks/e3b6f2c391d629bf.js"].map(t=>e.l(t))).then(()=>t(28419)))},45205,e=>{e.v(t=>Promise.all(["static/chunks/e874cc6d1e1b1fe4.js"].map(t=>e.l(t))).then(()=>t(16419)))},69023,e=>{e.v(t=>Promise.all(["static/chunks/a86b710967cf1cec.js"].map(t=>e.l(t))).then(()=>t(39776)))},69689,e=>{e.v(t=>Promise.all(["static/chunks/09f5ec5e8eec39a3.js"].map(t=>e.l(t))).then(()=>t(56290)))},60813,e=>{e.v(t=>Promise.all(["static/chunks/e3a1b07bf2fe0afc.js"].map(t=>e.l(t))).then(()=>t(52306)))},23705,e=>{e.v(t=>Promise.all(["static/chunks/637ec8116ba55336.js"].map(t=>e.l(t))).then(()=>t(97708)))},36057,e=>{e.v(t=>Promise.all(["static/chunks/6b37ba61c41badda.js"].map(t=>e.l(t))).then(()=>t(5405)))},17507,e=>{e.v(t=>Promise.all(["static/chunks/6323be2ba253054e.js"].map(t=>e.l(t))).then(()=>t(70881)))},82058,e=>{e.v(t=>Promise.all(["static/chunks/1567c0ada9975f54.js"].map(t=>e.l(t))).then(()=>t(45467)))},84221,e=>{e.v(t=>Promise.all(["static/chunks/1f4f7a2c028849a9.js"].map(t=>e.l(t))).then(()=>t(57990)))},81312,e=>{e.v(t=>Promise.all(["static/chunks/90025690c54d10e3.js"].map(t=>e.l(t))).then(()=>t(37224)))},81928,e=>{e.v(t=>Promise.all(["static/chunks/42352a8c30317bd8.js"].map(t=>e.l(t))).then(()=>t(87256)))},84600,e=>{e.v(t=>Promise.all(["static/chunks/e9a80722c62c47a2.js"].map(t=>e.l(t))).then(()=>t(20519)))},90491,e=>{e.v(t=>Promise.all(["static/chunks/2cb1a8aac1d20508.js"].map(t=>e.l(t))).then(()=>t(62088)))},35239,e=>{e.v(t=>Promise.all(["static/chunks/32df0f5f597df99a.js"].map(t=>e.l(t))).then(()=>t(71650)))},17421,e=>{e.v(t=>Promise.all(["static/chunks/139ee248d71cc9d9.js"].map(t=>e.l(t))).then(()=>t(57677)))},91110,e=>{e.v(t=>Promise.all(["static/chunks/410d0c392ff09599.js"].map(t=>e.l(t))).then(()=>t(10006)))},42086,e=>{e.v(t=>Promise.all(["static/chunks/cdf4d277428d3411.js"].map(t=>e.l(t))).then(()=>t(67881)))},5872,e=>{e.v(t=>Promise.all(["static/chunks/7be9067f76c94c40.js"].map(t=>e.l(t))).then(()=>t(64976)))},71711,e=>{e.v(t=>Promise.all(["static/chunks/f20a5acf8b08ad4d.js"].map(t=>e.l(t))).then(()=>t(29311)))},67031,e=>{e.v(t=>Promise.all(["static/chunks/1d23d7bb99a3c6fd.js"].map(t=>e.l(t))).then(()=>t(75789)))},75685,e=>{e.v(t=>Promise.all(["static/chunks/6a0ed3e7f34f960f.js"].map(t=>e.l(t))).then(()=>t(86882)))},4414,e=>{e.v(t=>Promise.all(["static/chunks/323f81e71f323d13.js"].map(t=>e.l(t))).then(()=>t(52164)))},77210,e=>{e.v(t=>Promise.all(["static/chunks/f28646f158f6acda.js"].map(t=>e.l(t))).then(()=>t(45141)))},30454,e=>{e.v(t=>Promise.all(["static/chunks/55ea73777104f87d.js"].map(t=>e.l(t))).then(()=>t(16267)))},80911,e=>{e.v(t=>Promise.all(["static/chunks/edd51bbfedd8309f.js"].map(t=>e.l(t))).then(()=>t(38783)))},97615,e=>{e.v(t=>Promise.all(["static/chunks/9391c67a47d0a51a.js"].map(t=>e.l(t))).then(()=>t(40804)))},85284,e=>{e.v(t=>Promise.all(["static/chunks/af3efd27046cf635.js"].map(t=>e.l(t))).then(()=>t(3962)))},46977,e=>{e.v(t=>Promise.all(["static/chunks/0cbf5e862eb59752.js"].map(t=>e.l(t))).then(()=>t(70564)))},36033,e=>{e.v(t=>Promise.all(["static/chunks/fa8b8a06b5b8d2e1.js"].map(t=>e.l(t))).then(()=>t(72299)))},57289,e=>{e.v(t=>Promise.all(["static/chunks/42b7c6cd2f9d7643.js"].map(t=>e.l(t))).then(()=>t(20685)))},49149,e=>{e.v(t=>Promise.all(["static/chunks/229a2746b608268e.js"].map(t=>e.l(t))).then(()=>t(18891)))},9974,e=>{e.v(t=>Promise.all(["static/chunks/d4f82983365c0be6.js"].map(t=>e.l(t))).then(()=>t(61011)))},85155,e=>{e.v(t=>Promise.all(["static/chunks/6623c82e1ee8df19.js"].map(t=>e.l(t))).then(()=>t(21618)))},59968,e=>{e.v(t=>Promise.all(["static/chunks/a45cca01a411e43a.js"].map(t=>e.l(t))).then(()=>t(51012)))},38898,e=>{e.v(t=>Promise.all(["static/chunks/8ac4afee27bb399d.js"].map(t=>e.l(t))).then(()=>t(368)))},22574,e=>{e.v(t=>Promise.all(["static/chunks/535c76ad63c951f4.js"].map(t=>e.l(t))).then(()=>t(48530)))},1716,e=>{e.v(t=>Promise.all(["static/chunks/a780fee91d1914b5.js"].map(t=>e.l(t))).then(()=>t(39444)))},24530,e=>{e.v(t=>Promise.all(["static/chunks/90358035e8c57951.js"].map(t=>e.l(t))).then(()=>t(23557)))},68769,e=>{e.v(t=>Promise.all(["static/chunks/b5334ae173b6fe2f.js"].map(t=>e.l(t))).then(()=>t(80804)))},67285,e=>{e.v(t=>Promise.all(["static/chunks/6607fc3665a211f7.js"].map(t=>e.l(t))).then(()=>t(4453)))},93126,e=>{e.v(t=>Promise.all(["static/chunks/94c7312be18f3f19.js"].map(t=>e.l(t))).then(()=>t(73024)))},8036,e=>{e.v(t=>Promise.all(["static/chunks/aeb3613948f2728c.js"].map(t=>e.l(t))).then(()=>t(81675)))},11338,e=>{e.v(t=>Promise.all(["static/chunks/fd46c0d7dd4b5db0.js"].map(t=>e.l(t))).then(()=>t(85710)))},21625,e=>{e.v(t=>Promise.all(["static/chunks/03ed6ceb37949fb6.js"].map(t=>e.l(t))).then(()=>t(56395)))},45304,e=>{e.v(t=>Promise.all(["static/chunks/18fa468c99d1e691.js"].map(t=>e.l(t))).then(()=>t(82042)))},38278,e=>{e.v(t=>Promise.all(["static/chunks/3af546d1edeb8303.js"].map(t=>e.l(t))).then(()=>t(19124)))},92872,e=>{e.v(t=>Promise.all(["static/chunks/46189d257b70f6b6.js"].map(t=>e.l(t))).then(()=>t(71659)))},26755,e=>{e.v(t=>Promise.all(["static/chunks/9b2fd7791660d086.js"].map(t=>e.l(t))).then(()=>t(46495)))},4937,e=>{e.v(t=>Promise.all(["static/chunks/e07147485972821b.js"].map(t=>e.l(t))).then(()=>t(56255)))},10758,e=>{e.v(t=>Promise.all(["static/chunks/4bd61d4e9b054285.js"].map(t=>e.l(t))).then(()=>t(8254)))},86422,e=>{e.v(t=>Promise.all(["static/chunks/5af71388cf9d3da5.js"].map(t=>e.l(t))).then(()=>t(52860)))},74604,e=>{e.v(t=>Promise.all(["static/chunks/83b009ceab791175.js"].map(t=>e.l(t))).then(()=>t(5209)))},26975,e=>{e.v(t=>Promise.all(["static/chunks/6d71cfc1f7683d60.js"].map(t=>e.l(t))).then(()=>t(6938)))},6369,e=>{e.v(t=>Promise.all(["static/chunks/e336e5664fe29d75.js"].map(t=>e.l(t))).then(()=>t(58134)))},7518,e=>{e.v(t=>Promise.all(["static/chunks/134cd3a9508142c7.js"].map(t=>e.l(t))).then(()=>t(21274)))},96057,e=>{e.v(t=>Promise.all(["static/chunks/17775cddad7093af.js"].map(t=>e.l(t))).then(()=>t(32867)))},92150,e=>{e.v(t=>Promise.all(["static/chunks/04f0d42768e79133.js"].map(t=>e.l(t))).then(()=>t(42941)))},3354,e=>{e.v(t=>Promise.all(["static/chunks/3067877c5eaccc73.js"].map(t=>e.l(t))).then(()=>t(85157)))},22316,e=>{e.v(t=>Promise.all(["static/chunks/609e2928facaede7.js"].map(t=>e.l(t))).then(()=>t(60012)))},32219,e=>{e.v(t=>Promise.all(["static/chunks/2e71c1f424094ef9.js"].map(t=>e.l(t))).then(()=>t(67138)))},37039,e=>{e.v(t=>Promise.all(["static/chunks/17727e254efd0ba9.js"].map(t=>e.l(t))).then(()=>t(21043)))},31273,e=>{e.v(t=>Promise.all(["static/chunks/9bb5304b73f27165.js"].map(t=>e.l(t))).then(()=>t(44733)))},12921,e=>{e.v(t=>Promise.all(["static/chunks/22be2e972ab4359e.js"].map(t=>e.l(t))).then(()=>t(27052)))},93305,e=>{e.v(t=>Promise.all(["static/chunks/47940fdf36b6d566.js"].map(t=>e.l(t))).then(()=>t(23233)))},65212,e=>{e.v(t=>Promise.all(["static/chunks/c243c7476f543aab.js"].map(t=>e.l(t))).then(()=>t(79917)))},61315,e=>{e.v(t=>Promise.all(["static/chunks/b45bf4586b657794.js"].map(t=>e.l(t))).then(()=>t(4245)))},88300,e=>{e.v(t=>Promise.all(["static/chunks/4cc4ba406d37cf8c.js"].map(t=>e.l(t))).then(()=>t(27574)))},82184,e=>{e.v(t=>Promise.all(["static/chunks/68a4b9389676e82b.js"].map(t=>e.l(t))).then(()=>t(56007)))},20651,e=>{e.v(t=>Promise.all(["static/chunks/6a008b05256af43c.js"].map(t=>e.l(t))).then(()=>t(50676)))},54566,e=>{e.v(t=>Promise.all(["static/chunks/a50be86c23422091.js"].map(t=>e.l(t))).then(()=>t(64540)))},73830,e=>{e.v(t=>Promise.all(["static/chunks/27737eeb86b4ecbe.js"].map(t=>e.l(t))).then(()=>t(31690)))},54610,e=>{e.v(t=>Promise.all(["static/chunks/ba77a1136b640f8a.js"].map(t=>e.l(t))).then(()=>t(93227)))}]);