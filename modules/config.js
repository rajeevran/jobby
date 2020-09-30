module.exports = function (profile) {
	var profileContainer = {
		"local": {
			USER_APN_CERTI: "/certificate/user/dev/apns-dev-cert.pem",
			USER_APN_KEY: "/certificate/user/dev/apns-dev-key-noenc.pem",
			FCM_SERVER_KEY: 'AAAA-8537-0:APA91bHuE28mHzRiAc4UTI_yPQVlAkpJGf7WHyDEAd7g-HZs0k2R-RmXm2hmY_qgjQRLtI880C4J2fwdhWhVUZqFOjCyc4JKS4ZR_YmVO-VHCqxFmoANmQ4CH6zWsra__OSYb1KKxHPd'

		},
		"production": {
			USER_APN_CERTI: "/certificate/user/production/user-pro-cert.pem",
			USER_APN_KEY: "/certificate/user/production/user-pro-key-noenc.pem",
			FCM_SERVER_KEY: 'AAAARee9EJw:APA91bGJvXu32q6UGFWN0BX6okTD7Nm7MklHcWEiJnGoAIGXr5voBEVjwqJcNEZCnHQa2NPIO393CiDREqK1l5xk1BhqoN7n-z_S2PCM_HgONgsof68kyzS0gkQ-bpnNh7u7QLk5mvIC'

		},
		"production_ios": {
			USER_APN_CERTI: "/certificate/user/production/user-pro-cert.pem",
			USER_APN_KEY: "/certificate/user/production/user-pro-key-noenc.pem",
			FCM_SERVER_KEY: 'AAAA-8537-0:APA91bHuE28mHzRiAc4UTI_yPQVlAkpJGf7WHyDEAd7g-HZs0k2R-RmXm2hmY_qgjQRLtI880C4J2fwdhWhVUZqFOjCyc4JKS4ZR_YmVO-VHCqxFmoANmQ4CH6zWsra__OSYb1KKxHPd'

		}

	}

	return profileContainer[profile];
}