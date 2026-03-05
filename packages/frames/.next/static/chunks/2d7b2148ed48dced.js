(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,755263,e=>{"use strict";var t=`{
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
`;e.s(["en_US_default",()=>t])},96923,e=>{"use strict";var t=e.i(843476),o=e.i(271645),r=e.i(722652),a=e.i(103111),n=e.i(574983),s=e.i(110163),i=e.i(297197),l=e.i(912598),c=e.i(619273),p=e.i(286491),u=e.i(540143),h=e.i(915823),d=class extends h.Subscribable{constructor(e={}){super(),this.config=e,this.#e=new Map}#e;build(e,t,o){let r=t.queryKey,a=t.queryHash??(0,c.hashQueryKeyByOptions)(r,t),n=this.get(a);return n||(n=new p.Query({client:e,queryKey:r,queryHash:a,options:e.defaultQueryOptions(t),state:o,defaultOptions:e.getQueryDefaults(r)}),this.add(n)),n}add(e){this.#e.has(e.queryHash)||(this.#e.set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){let t=this.#e.get(e.queryHash);t&&(e.destroy(),t===e&&this.#e.delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){u.notifyManager.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return this.#e.get(e)}getAll(){return[...this.#e.values()]}find(e){let t={exact:!0,...e};return this.getAll().find(e=>(0,c.matchQuery)(t,e))}findAll(e={}){let t=this.getAll();return Object.keys(e).length>0?t.filter(t=>(0,c.matchQuery)(e,t)):t}notify(e){u.notifyManager.batch(()=>{this.listeners.forEach(t=>{t(e)})})}onFocus(){u.notifyManager.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){u.notifyManager.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}},m=e.i(114272),y=h,f=class extends y.Subscribable{constructor(e={}){super(),this.config=e,this.#t=new Set,this.#o=new Map,this.#r=0}#t;#o;#r;build(e,t,o){let r=new m.Mutation({client:e,mutationCache:this,mutationId:++this.#r,options:e.defaultMutationOptions(t),state:o});return this.add(r),r}add(e){this.#t.add(e);let t=w(e);if("string"==typeof t){let o=this.#o.get(t);o?o.push(e):this.#o.set(t,[e])}this.notify({type:"added",mutation:e})}remove(e){if(this.#t.delete(e)){let t=w(e);if("string"==typeof t){let o=this.#o.get(t);if(o)if(o.length>1){let t=o.indexOf(e);-1!==t&&o.splice(t,1)}else o[0]===e&&this.#o.delete(t)}}this.notify({type:"removed",mutation:e})}canRun(e){let t=w(e);if("string"!=typeof t)return!0;{let o=this.#o.get(t),r=o?.find(e=>"pending"===e.state.status);return!r||r===e}}runNext(e){let t=w(e);if("string"!=typeof t)return Promise.resolve();{let o=this.#o.get(t)?.find(t=>t!==e&&t.state.isPaused);return o?.continue()??Promise.resolve()}}clear(){u.notifyManager.batch(()=>{this.#t.forEach(e=>{this.notify({type:"removed",mutation:e})}),this.#t.clear(),this.#o.clear()})}getAll(){return Array.from(this.#t)}find(e){let t={exact:!0,...e};return this.getAll().find(e=>(0,c.matchMutation)(t,e))}findAll(e={}){return this.getAll().filter(t=>(0,c.matchMutation)(e,t))}notify(e){u.notifyManager.batch(()=>{this.listeners.forEach(t=>{t(e)})})}resumePausedMutations(){let e=this.getAll().filter(e=>e.state.isPaused);return u.notifyManager.batch(()=>Promise.all(e.map(e=>e.continue().catch(c.noop))))}};function w(e){return e.options.scope?.id}var b=e.i(175555),k=e.i(814448);function g(e){return{onFetch:(t,o)=>{let r=t.options,a=t.fetchOptions?.meta?.fetchMore?.direction,n=t.state.data?.pages||[],s=t.state.data?.pageParams||[],i={pages:[],pageParams:[]},l=0,p=async()=>{let o=!1,p=(0,c.ensureQueryFn)(t.options,t.fetchOptions),u=async(e,r,a)=>{let n;if(o)return Promise.reject();if(null==r&&e.pages.length)return Promise.resolve(e);let s=(n={client:t.client,queryKey:t.queryKey,pageParam:r,direction:a?"backward":"forward",meta:t.options.meta},(0,c.addConsumeAwareSignal)(n,()=>t.signal,()=>o=!0),n),i=await p(s),{maxPages:l}=t.options,u=a?c.addToStart:c.addToEnd;return{pages:u(e.pages,i,l),pageParams:u(e.pageParams,r,l)}};if(a&&n.length){let e="backward"===a,t={pages:n,pageParams:s},o=(e?function(e,{pages:t,pageParams:o}){return t.length>0?e.getPreviousPageParam?.(t[0],t,o[0],o):void 0}:W)(r,t);i=await u(t,o,e)}else{let t=e??n.length;do{let e=0===l?s[0]??r.initialPageParam:W(r,i);if(l>0&&null==e)break;i=await u(i,e),l++}while(l<t)}return i};t.options.persister?t.fetchFn=()=>t.options.persister?.(p,{client:t.client,queryKey:t.queryKey,meta:t.options.meta,signal:t.signal},o):t.fetchFn=p}}}function W(e,{pages:t,pageParams:o}){let r=t.length-1;return t.length>0?e.getNextPageParam(t[r],t,o[r],o):void 0}var C=class{#a;#n;#s;#i;#l;#c;#p;#u;constructor(e={}){this.#a=e.queryCache||new d,this.#n=e.mutationCache||new f,this.#s=e.defaultOptions||{},this.#i=new Map,this.#l=new Map,this.#c=0}mount(){this.#c++,1===this.#c&&(this.#p=b.focusManager.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#a.onFocus())}),this.#u=k.onlineManager.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#a.onOnline())}))}unmount(){this.#c--,0===this.#c&&(this.#p?.(),this.#p=void 0,this.#u?.(),this.#u=void 0)}isFetching(e){return this.#a.findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return this.#n.findAll({...e,status:"pending"}).length}getQueryData(e){let t=this.defaultQueryOptions({queryKey:e});return this.#a.get(t.queryHash)?.state.data}ensureQueryData(e){let t=this.defaultQueryOptions(e),o=this.#a.build(this,t),r=o.state.data;return void 0===r?this.fetchQuery(e):(e.revalidateIfStale&&o.isStaleByTime((0,c.resolveStaleTime)(t.staleTime,o))&&this.prefetchQuery(t),Promise.resolve(r))}getQueriesData(e){return this.#a.findAll(e).map(({queryKey:e,state:t})=>[e,t.data])}setQueryData(e,t,o){let r=this.defaultQueryOptions({queryKey:e}),a=this.#a.get(r.queryHash),n=a?.state.data,s=(0,c.functionalUpdate)(t,n);if(void 0!==s)return this.#a.build(this,r).setData(s,{...o,manual:!0})}setQueriesData(e,t,o){return u.notifyManager.batch(()=>this.#a.findAll(e).map(({queryKey:e})=>[e,this.setQueryData(e,t,o)]))}getQueryState(e){let t=this.defaultQueryOptions({queryKey:e});return this.#a.get(t.queryHash)?.state}removeQueries(e){let t=this.#a;u.notifyManager.batch(()=>{t.findAll(e).forEach(e=>{t.remove(e)})})}resetQueries(e,t){let o=this.#a;return u.notifyManager.batch(()=>(o.findAll(e).forEach(e=>{e.reset()}),this.refetchQueries({type:"active",...e},t)))}cancelQueries(e,t={}){let o={revert:!0,...t};return Promise.all(u.notifyManager.batch(()=>this.#a.findAll(e).map(e=>e.cancel(o)))).then(c.noop).catch(c.noop)}invalidateQueries(e,t={}){return u.notifyManager.batch(()=>(this.#a.findAll(e).forEach(e=>{e.invalidate()}),e?.refetchType==="none")?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},t))}refetchQueries(e,t={}){let o={...t,cancelRefetch:t.cancelRefetch??!0};return Promise.all(u.notifyManager.batch(()=>this.#a.findAll(e).filter(e=>!e.isDisabled()&&!e.isStatic()).map(e=>{let t=e.fetch(void 0,o);return o.throwOnError||(t=t.catch(c.noop)),"paused"===e.state.fetchStatus?Promise.resolve():t}))).then(c.noop)}fetchQuery(e){let t=this.defaultQueryOptions(e);void 0===t.retry&&(t.retry=!1);let o=this.#a.build(this,t);return o.isStaleByTime((0,c.resolveStaleTime)(t.staleTime,o))?o.fetch(t):Promise.resolve(o.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(c.noop).catch(c.noop)}fetchInfiniteQuery(e){return e.behavior=g(e.pages),this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(c.noop).catch(c.noop)}ensureInfiniteQueryData(e){return e.behavior=g(e.pages),this.ensureQueryData(e)}resumePausedMutations(){return k.onlineManager.isOnline()?this.#n.resumePausedMutations():Promise.resolve()}getQueryCache(){return this.#a}getMutationCache(){return this.#n}getDefaultOptions(){return this.#s}setDefaultOptions(e){this.#s=e}setQueryDefaults(e,t){this.#i.set((0,c.hashKey)(e),{queryKey:e,defaultOptions:t})}getQueryDefaults(e){let t=[...this.#i.values()],o={};return t.forEach(t=>{(0,c.partialMatchKey)(e,t.queryKey)&&Object.assign(o,t.defaultOptions)}),o}setMutationDefaults(e,t){this.#l.set((0,c.hashKey)(e),{mutationKey:e,defaultOptions:t})}getMutationDefaults(e){let t=[...this.#l.values()],o={};return t.forEach(t=>{(0,c.partialMatchKey)(e,t.mutationKey)&&Object.assign(o,t.defaultOptions)}),o}defaultQueryOptions(e){if(e._defaulted)return e;let t={...this.#s.queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return t.queryHash||(t.queryHash=(0,c.hashQueryKeyByOptions)(t.queryKey,t)),void 0===t.refetchOnReconnect&&(t.refetchOnReconnect="always"!==t.networkMode),void 0===t.throwOnError&&(t.throwOnError=!!t.suspense),!t.networkMode&&t.persister&&(t.networkMode="offlineFirst"),t.queryFn===c.skipToken&&(t.enabled=!1),t}defaultMutationOptions(e){return e?._defaulted?e:{...this.#s.mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){this.#a.clear(),this.#n.clear()}};let v=(0,r.getDefaultConfig)({appName:"Chaos Oracle",projectId:"3f2d2165c699981880497799195e8656",chains:[i.base],transports:{[i.base.id]:(0,s.http)("https://mainnet.base.org")},ssr:!0}),x=new C;function P({children:e}){let[s,i]=(0,o.useState)(!1);return((0,o.useEffect)(()=>{i(!0)},[]),s)?(0,t.jsx)(n.WagmiProvider,{config:v,children:(0,t.jsx)(l.QueryClientProvider,{client:x,children:(0,t.jsx)(r.RainbowKitProvider,{theme:(0,a.darkTheme)({accentColor:"#ff4500",accentColorForeground:"white",borderRadius:"none",fontStack:"system",overlayBlur:"small"}),modalSize:"compact",children:e})})}):(0,t.jsx)(t.Fragment,{children:e})}e.s(["Providers",()=>P],96923)},101139,e=>{e.v(t=>Promise.all(["static/chunks/034083a8ec975080.js"].map(t=>e.l(t))).then(()=>t(109963)))},389892,e=>{e.v(e=>Promise.resolve().then(()=>e(337575)))},66216,e=>{e.v(t=>Promise.all(["static/chunks/4a3f06f99f0e0bca.js","static/chunks/0194d4a436410713.js","static/chunks/c5b719c374ae7bf6.js"].map(t=>e.l(t))).then(()=>t(477350)))},224814,e=>{e.v(t=>Promise.all(["static/chunks/f2c16049b1cb47a3.js","static/chunks/fc4506bba7917cdd.js"].map(t=>e.l(t))).then(()=>t(653806)))},470308,e=>{e.v(t=>Promise.all(["static/chunks/d9a07d5749396691.js"].map(t=>e.l(t))).then(()=>t(915618)))},474683,e=>{e.v(t=>Promise.all(["static/chunks/bdc1f6e120e2b14c.js"].map(t=>e.l(t))).then(()=>t(289329)))},381024,e=>{e.v(t=>Promise.all(["static/chunks/4b7671491fa87b14.js","static/chunks/3ac87da96f3d7c34.js"].map(t=>e.l(t))).then(()=>t(607627)))},114544,e=>{e.v(t=>Promise.all(["static/chunks/e0ed2649d3073a5e.js"].map(t=>e.l(t))).then(()=>t(64871)))},199160,e=>{e.v(t=>Promise.all(["static/chunks/c06b74b32486f252.js"].map(t=>e.l(t))).then(()=>t(552117)))},458488,e=>{e.v(t=>Promise.all(["static/chunks/da56d9c35ae347ef.js"].map(t=>e.l(t))).then(()=>t(828419)))},945205,e=>{e.v(t=>Promise.all(["static/chunks/0bcbb46c5e3fdf25.js"].map(t=>e.l(t))).then(()=>t(216419)))},669023,e=>{e.v(t=>Promise.all(["static/chunks/f127eddbd265565e.js"].map(t=>e.l(t))).then(()=>t(739776)))},469689,e=>{e.v(t=>Promise.all(["static/chunks/864147b80873992f.js"].map(t=>e.l(t))).then(()=>t(356290)))},760813,e=>{e.v(t=>Promise.all(["static/chunks/1b12645ee8bc884b.js"].map(t=>e.l(t))).then(()=>t(252306)))},423705,e=>{e.v(t=>Promise.all(["static/chunks/a75d878f4f5f13a9.js"].map(t=>e.l(t))).then(()=>t(997708)))},736057,e=>{e.v(t=>Promise.all(["static/chunks/f5c6a72a7b227ff8.js"].map(t=>e.l(t))).then(()=>t(905405)))},917507,e=>{e.v(t=>Promise.all(["static/chunks/6323be2ba253054e.js"].map(t=>e.l(t))).then(()=>t(70881)))},82058,e=>{e.v(t=>Promise.all(["static/chunks/eb6ec9225ab8f4a4.js"].map(t=>e.l(t))).then(()=>t(945467)))},984221,e=>{e.v(t=>Promise.all(["static/chunks/e735df406043c439.js"].map(t=>e.l(t))).then(()=>t(657990)))},281312,e=>{e.v(t=>Promise.all(["static/chunks/a53900a82d8881ce.js"].map(t=>e.l(t))).then(()=>t(737224)))},581928,e=>{e.v(t=>Promise.all(["static/chunks/58f6b85793db030f.js"].map(t=>e.l(t))).then(()=>t(887256)))},784600,e=>{e.v(t=>Promise.all(["static/chunks/50482d5029b0c1eb.js"].map(t=>e.l(t))).then(()=>t(220519)))},290491,e=>{e.v(t=>Promise.all(["static/chunks/83a55f541159f125.js"].map(t=>e.l(t))).then(()=>t(162088)))},435239,e=>{e.v(t=>Promise.all(["static/chunks/f8ea650a7506bc8d.js"].map(t=>e.l(t))).then(()=>t(771650)))},917421,e=>{e.v(t=>Promise.all(["static/chunks/a09a24d366d50595.js"].map(t=>e.l(t))).then(()=>t(157677)))},391110,e=>{e.v(t=>Promise.all(["static/chunks/28abe5bdf71d034d.js"].map(t=>e.l(t))).then(()=>t(210006)))},442086,e=>{e.v(t=>Promise.all(["static/chunks/cdf4d277428d3411.js"].map(t=>e.l(t))).then(()=>t(67881)))},105872,e=>{e.v(t=>Promise.all(["static/chunks/fd55b5c44095d849.js"].map(t=>e.l(t))).then(()=>t(864976)))},271711,e=>{e.v(t=>Promise.all(["static/chunks/f20a5acf8b08ad4d.js"].map(t=>e.l(t))).then(()=>t(29311)))},567031,e=>{e.v(t=>Promise.all(["static/chunks/1d23d7bb99a3c6fd.js"].map(t=>e.l(t))).then(()=>t(75789)))},575685,e=>{e.v(t=>Promise.all(["static/chunks/e625a34073f9e963.js"].map(t=>e.l(t))).then(()=>t(786882)))},604414,e=>{e.v(t=>Promise.all(["static/chunks/1fbab4c19bf07056.js"].map(t=>e.l(t))).then(()=>t(352164)))},777210,e=>{e.v(t=>Promise.all(["static/chunks/bb7631c2e765bae5.js"].map(t=>e.l(t))).then(()=>t(745141)))},230454,e=>{e.v(t=>Promise.all(["static/chunks/febaee82fe46dd12.js"].map(t=>e.l(t))).then(()=>t(516267)))},80911,e=>{e.v(t=>Promise.all(["static/chunks/31312a55a741195b.js"].map(t=>e.l(t))).then(()=>t(138783)))},197615,e=>{e.v(t=>Promise.all(["static/chunks/000d5aaae1649753.js"].map(t=>e.l(t))).then(()=>t(540804)))},485284,e=>{e.v(t=>Promise.all(["static/chunks/3f89b7b695a6d7dc.js"].map(t=>e.l(t))).then(()=>t(303962)))},346977,e=>{e.v(t=>Promise.all(["static/chunks/98f04ecab8ba803d.js"].map(t=>e.l(t))).then(()=>t(370564)))},736033,e=>{e.v(t=>Promise.all(["static/chunks/07353aebad6bc3dc.js"].map(t=>e.l(t))).then(()=>t(472299)))},557289,e=>{e.v(t=>Promise.all(["static/chunks/12dab76068ded989.js"].map(t=>e.l(t))).then(()=>t(920685)))},649149,e=>{e.v(t=>Promise.all(["static/chunks/9b3f225083ef0a3d.js"].map(t=>e.l(t))).then(()=>t(418891)))},9974,e=>{e.v(t=>Promise.all(["static/chunks/bf12f4c1f32f80d6.js"].map(t=>e.l(t))).then(()=>t(761011)))},485155,e=>{e.v(t=>Promise.all(["static/chunks/0c91bd755a4f9dab.js"].map(t=>e.l(t))).then(()=>t(421618)))},759968,e=>{e.v(t=>Promise.all(["static/chunks/a197228ba3c59a4c.js"].map(t=>e.l(t))).then(()=>t(251012)))},38898,e=>{e.v(t=>Promise.all(["static/chunks/87d8b1e64f99f9aa.js"].map(t=>e.l(t))).then(()=>t(900368)))},822574,e=>{e.v(t=>Promise.all(["static/chunks/b8670320de73bd6e.js"].map(t=>e.l(t))).then(()=>t(248530)))},101716,e=>{e.v(t=>Promise.all(["static/chunks/0763922dc86777d7.js"].map(t=>e.l(t))).then(()=>t(839444)))},24530,e=>{e.v(t=>Promise.all(["static/chunks/6ccf8e284ca75052.js"].map(t=>e.l(t))).then(()=>t(723557)))},768769,e=>{e.v(t=>Promise.all(["static/chunks/f855adf781fbabb6.js"].map(t=>e.l(t))).then(()=>t(880804)))},667285,e=>{e.v(t=>Promise.all(["static/chunks/5e52b85b2272e504.js"].map(t=>e.l(t))).then(()=>t(804453)))},193126,e=>{e.v(t=>Promise.all(["static/chunks/d4398ab35b431f0d.js"].map(t=>e.l(t))).then(()=>t(973024)))},708036,e=>{e.v(t=>Promise.all(["static/chunks/102c06659c7540e5.js"].map(t=>e.l(t))).then(()=>t(481675)))},811338,e=>{e.v(t=>Promise.all(["static/chunks/d7d3a2be52dabc28.js"].map(t=>e.l(t))).then(()=>t(385710)))},321625,e=>{e.v(t=>Promise.all(["static/chunks/9c0b5f5ffab2a5bb.js"].map(t=>e.l(t))).then(()=>t(656395)))},345304,e=>{e.v(t=>Promise.all(["static/chunks/3ada4ad80b724a17.js"].map(t=>e.l(t))).then(()=>t(382042)))},738278,e=>{e.v(t=>Promise.all(["static/chunks/5894511f7316295f.js"].map(t=>e.l(t))).then(()=>t(619124)))},792872,e=>{e.v(t=>Promise.all(["static/chunks/e5d550b9732ab661.js"].map(t=>e.l(t))).then(()=>t(371659)))},226755,e=>{e.v(t=>Promise.all(["static/chunks/3f039b77c6180d48.js"].map(t=>e.l(t))).then(()=>t(446495)))},504937,e=>{e.v(t=>Promise.all(["static/chunks/e74d6a3a94fc6c26.js"].map(t=>e.l(t))).then(()=>t(156255)))},410758,e=>{e.v(t=>Promise.all(["static/chunks/b7eedf15854f081e.js"].map(t=>e.l(t))).then(()=>t(908254)))},886422,e=>{e.v(t=>Promise.all(["static/chunks/383937fef5e1ddb5.js"].map(t=>e.l(t))).then(()=>t(652860)))},274604,e=>{e.v(t=>Promise.all(["static/chunks/a8aa6ff78e82658e.js"].map(t=>e.l(t))).then(()=>t(505209)))},426975,e=>{e.v(t=>Promise.all(["static/chunks/6d71cfc1f7683d60.js"].map(t=>e.l(t))).then(()=>t(6938)))},106369,e=>{e.v(t=>Promise.all(["static/chunks/dce3f3842db52dbe.js"].map(t=>e.l(t))).then(()=>t(358134)))},507518,e=>{e.v(t=>Promise.all(["static/chunks/528cda09397ca281.js"].map(t=>e.l(t))).then(()=>t(221274)))},396057,e=>{e.v(t=>Promise.all(["static/chunks/a0342869754663ac.js"].map(t=>e.l(t))).then(()=>t(432867)))},192150,e=>{e.v(t=>Promise.all(["static/chunks/04f0d42768e79133.js"].map(t=>e.l(t))).then(()=>t(42941)))},703354,e=>{e.v(t=>Promise.all(["static/chunks/ce5d6995e254e19e.js"].map(t=>e.l(t))).then(()=>t(185157)))},422316,e=>{e.v(t=>Promise.all(["static/chunks/e9abab00795bfca8.js"].map(t=>e.l(t))).then(()=>t(460012)))},932219,e=>{e.v(t=>Promise.all(["static/chunks/3f8afd6e6837c4b6.js"].map(t=>e.l(t))).then(()=>t(467138)))},437039,e=>{e.v(t=>Promise.all(["static/chunks/17727e254efd0ba9.js"].map(t=>e.l(t))).then(()=>t(21043)))},31273,e=>{e.v(t=>Promise.all(["static/chunks/604c018433c5d66d.js"].map(t=>e.l(t))).then(()=>t(444733)))},812921,e=>{e.v(t=>Promise.all(["static/chunks/ba246cf12e0a4cd0.js"].map(t=>e.l(t))).then(()=>t(327052)))},93305,e=>{e.v(t=>Promise.all(["static/chunks/27282591893e9efa.js"].map(t=>e.l(t))).then(()=>t(823233)))},65212,e=>{e.v(t=>Promise.all(["static/chunks/aa612cb4451d0ce2.js"].map(t=>e.l(t))).then(()=>t(879917)))},961315,e=>{e.v(t=>Promise.all(["static/chunks/b45bf4586b657794.js"].map(t=>e.l(t))).then(()=>t(4245)))},588300,e=>{e.v(t=>Promise.all(["static/chunks/280b3e1534b10084.js"].map(t=>e.l(t))).then(()=>t(227574)))},782184,e=>{e.v(t=>Promise.all(["static/chunks/cb9c522bf9d1dc24.js"].map(t=>e.l(t))).then(()=>t(956007)))},20651,e=>{e.v(t=>Promise.all(["static/chunks/88be83e3fde7daca.js"].map(t=>e.l(t))).then(()=>t(150676)))},254566,e=>{e.v(t=>Promise.all(["static/chunks/8fdd0d89755b8508.js"].map(t=>e.l(t))).then(()=>t(164540)))},873830,e=>{e.v(t=>Promise.all(["static/chunks/7bd87e064f4afcf8.js"].map(t=>e.l(t))).then(()=>t(631690)))},554610,e=>{e.v(t=>Promise.all(["static/chunks/ba77a1136b640f8a.js"].map(t=>e.l(t))).then(()=>t(93227)))}]);