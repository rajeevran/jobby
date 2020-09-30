module.exports = {
    "port": 1435,
    "secretKey": "hyrgqwjdfbw4534efqrwer2q38945765",
    "link_expire": 172800,
    dbAccess: 'server',
    database: {
        'server': {
            username: 'brain1uMMong0User',
            password: 'PL5qnU9nuvX0pBa',
            host: 'nodeserver.brainiuminfotech.com',
            port: '27017',
            dbName: 'jobby',
            authDb: 'admin'
        },
        'local': {
            port: 27017,
            host: "localhost",
            dbName: "jobby"
        }
    },
    email: {
        database: "mongodb://localhost:27017/jobby",
        MAIL_USERNAME: "liveapp.brainium@gmail.com",
        MAIL_PASS: "YW5kcm9pZDIwMTY"
    },
    twillow: {
        live: {
            accountSid: "AC60641b0365287e334555796ca998d402",
            authToken: "a702091fd4c8089a7f7e80ff6ae2dfed",
            from_no: "+12062600506"
        },
        test: {
            accountSid: "AC3f4b8426a5026d7441f19a8b6c68fc18",
            authToken: "823efaec212bb07953b54a00f87a8ebd",
            from_no: "+15005550006"
        }
    },
    google_location_options: {
        provider: 'google',
        // Optional depending on the providers 
        httpAdapter: 'https', // Default 
        apiKey: 'AIzaSyAZrlEyL0r3AX-KVpZCRBEINPtQQ9wIZhI',
        // This api key needs to change before live because it is taken from another project
        formatter: null // 'gpx', 'string', ... 
    },
    uploadInvoicePath: "public/uploads/invoice/",
    InvoicePath: "uploads/invoice/",
    jobDemoLogoPath: "uploads/dummy/demo-job.png",
    companyDemoLogoPath: "uploads/dummy/demo-company.png",
    userDemoPicPath: "uploads/dummy/demo-profile.png",
    uploadProfilepicPath: "public/uploads/profilepic/",
    profilepicPath: "uploads/profilepic/",
    uploadcompanylogoPath: "public/uploads/company/",
    companylogoPath: "uploads/company/",
    uploadjoblogoPath: "public/uploads/job/",
    joblogoPath: "uploads/job/",
    uploadResumePath: "public/uploads/resumes/",
    resumePath: "uploads/resumes/",

    // socketUrl: "https://nodeserver.brainiuminfotech.com:1426/",
    liveUrl: "https://nodeserver.brainiuminfotech.com:1435/",
    baseUrl: "https://nodeserver.brainiuminfotech.com/dibyendu/jobby/admin/#/",
    logPath: "/ServiceLogs/admin.debug.log",
    dev_mode: true,
    __root_dir: __dirname,
    __site_url: '',
    limit: 10

}