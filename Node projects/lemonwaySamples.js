https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx/RegisterWallet

{
  "p": {   
    "wlLogin":"john_arey@yahoo.co.uk",
    "wlPass":"john_arey@yahoo.co.uk",
    "language":"EN",
    "version":"2.0",
    "walletIp":"111.93.58.27",
    "walletUa":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36",
    "wallet": "HIMAN8881488266934",
    "clientMail":"hima@ignivasolutions.com",
    "clientTitle":"F",
    "clientFirstName" : "Himanshi",
    "clientLastName":"Banga",
    "payerOrBeneficiary":"1"
	}
}

{
  "d": {
    "__type": "WonderLib.RegisterWalletResult",
    "WALLET": {
      "ID": "HIMAN8881488266934",
      "LWID": "15692"
    },
    "E": null
  }
}

-------------------------------------------------------------------------------------------------------------------------------

https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx/GetWalletDetails

{
	"p":{   
    "wlLogin":"john_arey@yahoo.co.uk",
    "wlPass":"john_arey@yahoo.co.uk",
    "language":"EN",
    "version":"2.0",
    "walletIp":"111.93.58.27",
    "walletUa":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36",
    "wallet":"simranbind1488288071",
    "email":"himanshi.banga@ignivasolutions.com"
}
}

{
  "d": {
    "__type": "WonderLib.GetWalletDetailsResult",
    "WALLET": {
      "ID": "simranbind1488288071",
      "BAL": "0.00",
      "NAME": "Simran BINDAL",
      "EMAIL": "one@gmail.com",
      "DOCS": [],
      "IBANS": [],
      "STATUS": "5",
      "BLOCKED": "0",
      "SDDMANDATES": [],
      "LWID": "15681",
      "CARDS": [],
      "FirstName": "Simran",
      "LastName": "BINDAL",
      "CompanyName": "",
      "CompanyDescription": "",
      "CompanyWebsite": "",
      "isDebtor": "0",
      "payerOrBeneficiary": "1"
    },
    "E": null
  }
}

-------------------------------------------------------------------------------------------------------------------------------

https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx/RegisterCard

{
	"p":{  
		 "wlLogin":"john_arey@yahoo.co.uk",
		"wlPass":"john_arey@yahoo.co.uk",
		"language":"EN",
		"version":"2.0",
		"walletIp":"111.93.58.27",
		"walletUa":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36",
		"wallet":"HIMAN1488266934",
		"cardType": 	"1",
	    "cardNumber": 	"5017670000006700",
	    "cardCode": 	"123",
	    "cardDate": 	"12/2026"
	}
}


{
  "d": {
    "__type": "WonderLib.RegisterCardResult",
    "CARD": {
      "ID": "8311",
      "EXTRA": {
        "IS3DS": "0",
        "CTRY": "",
        "AUTH": "371177",
        "NUM": "501767XXXXXX1800",
        "EXP": "12/2019"
      }
    },
    "E": null
  }
}

------------------------------------------------------------------------------------------------------------------------------

https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx/MoneyInWithCardId

{
  "p": {   
    "wlLogin":"john_arey@yahoo.co.uk",
    "wlPass":"john_arey@yahoo.co.uk",
    "language":"EN",
    "version":"1.0",
    "walletIp":"111.93.58.27",
    "walletUa":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36",
    "cardId": "8311",
   	"wallet":"simran1488343871",
   	"amountTot": "100.00",
	"amountCom": "10.00"
	}
}

{
  "d": {
    "__type": "WonderLib.MoneyInResult",
    "TRANS": {
      "HPAY": {
        "ID": "29798",
        "MLABEL": "501767XXXXXX1800",
        "DATE": "01/03/2017 06:05:13",
        "SEN": "",
        "REC": "simran1488343871",
        "DEB": "0.00",
        "CRED": "90.00",
        "COM": "10.00",
        "MSG": "",
        "STATUS": "3",
        "EXTRA": null
      }
    },
    "E": null
  }
}

------------------------------------------------------------------------------------------------------------------------------

https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx/RegisterIBAN

{
  "p": {   
    "wlLogin":"john_arey@yahoo.co.uk",
    "wlPass":"john_arey@yahoo.co.uk",
    "language":"EN",
    "version":"1.0",
    "walletIp":"111.93.58.27",
    "walletUa":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36",
   	"wallet":"simran1488343871",
    "holder":"Receiver",
    "bic": 	"ABCDEFGHIJK",
    "IBAN": "FR1420041010050500013M02606",
    "dom1": "MNJK"
	}
}

{
  "d": {
    "__type": "WonderLib.RegisterIBANResult",
    "IBAN_REGISTER": {
      "S": "5",
      "ID": null //
    },
    "E": null
  }
} 

//AFTER FETCH
{
  "d": {
    "__type": "WonderLib.GetWalletDetailsResult",
    "WALLET": {
      "ID": "simran1488343871",
      "BAL": "90.00",
      "NAME": "Simran ELEVENTHHOUR",
      "EMAIL": "sim12123@gmail.com",
      "DOCS": [],
      "IBANS": [
        {
          "ID": "3601",
          "S": "5",
          "DATA": "FR1420041010050500013M02606",
          "SWIFT": "ABCDEFGHIJK",
          "HOLDER": "RECEIVER"
        }
      ],
      "STATUS": "5",
      "BLOCKED": "0",
      "SDDMANDATES": [],
      "LWID": "15697",
      "CARDS": [
        {
          "ID": "8311",
          "EXTRA": {
            "IS3DS": "0",
            "CTRY": "",
            "AUTH": "371177",
            "NUM": "501767XXXXXX1800",
            "EXP": "12/2019",
            "TYP": "VISA"
          }
        }
      ],
      "FirstName": "Simran",
      "LastName": "ELEVENTHHOUR",
      "CompanyName": "",
      "CompanyDescription": "",
      "CompanyWebsite": "",
      "isDebtor": "0",
      "payerOrBeneficiary": "1"
    },
    "E": null
  }
}


------------------------------------------------------------------------------------------------------------------------------
//transfer from buyer's card to his wallet
https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx/MoneyOut

{
  "p": {   
    "wlLogin":"john_arey@yahoo.co.uk",
    "wlPass":"john_arey@yahoo.co.uk",
    "language":"EN",
    "version":"1.0",
    "walletIp":"111.93.58.27",
    "walletUa":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.76 Safari/537.36",
  "wallet":"himanshi1488353476",
    "amountTot":"200.00",
    "ibanId":"3671"
  }
}

{
  "d": {
    "__type": "WonderLib.MoneyOutResultObject",
    "TRANS": {
      "HPAY": {
        "ID": "30022",
        "MLABEL": "FR1420041010050500013M02606",
        "MID": null,
        "DATE": "02/03/2017 08:55:18",
        "SEN": "himanshi1488353476",
        "REC": "",
        "DEB": "200.00",
        "CRED": "0.00",
        "COM": "0.00",
        "MSG": "",
        "STATUS": "3"
      }
    },
    "E": null
  }
}