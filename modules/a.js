module.exports =
    '<body style="padding: 0;margin: 0;font-family: Acme, sans-serif;">\
        <div style="width:600px;margin:0 auto;background-image: url({{ site_url }}uploads/email_template/top_bg.png);background-repeat: no-repeat; text-align: center;">\
            <img style="margin-top: 5%;" src="{{ site_url }}uploads/email_template/logo.png" alt="ezfoodie-logo">\
            <div style="margin-top: 8%;text-align: center;list-style: none; font-family: Acme, sans-serif;">\
                <ul style="list-style: none;">\
                    <li style="color:#827f9e;font-size: 20px;">Hey {{ name }},</li>\
                    <li style="color:#0e0d1f; font-size: 35px;">Welcome to Ezfoodie!</li>\
                    <li style="color:#12c0f0;font-size: 20px;">Being a foodie is that easy</li>\
                    <li style="color:#12c0f0;font-size: 20px;">Your Activation Code is <b style="color:#0e0d1f;">{{ verification_code }}</b> . Please use this code and activate your account.</li>\
                </ul>\
            </div>\
            <img src="{{ site_url }}uploads/email_template/phone.png" alt="phone-view" style="margin-top:10%;">\
            <div style="background-image: url({{ site_url }}uploads/email_template/phone_bg.png); height: 248px; margin-top: -35%;"></div>\
            <div style="margin-top: 5%; background-color: white; font-family: Acme, sans-serif; text-align: center;list-style: none;">\
                <ul style="list-style: none;">\
                    <li style="font-size: 20px; color: #020a1d;line-height: 53px;">Ready to place your first order?</li>\
                    <li style="font-size: 18px;color:#827f9e"><span style="color:#b3bf29;">Join Ezfoodie</span> community. Take out food, team building,  </li>\
                    <li style="font-size: 18px;color:#827f9e"><span style="color:#b3bf29">free meals</span> and much more!</li>\
                </ul>\
                <button style="margin-top: 10%; height: 60px; width: 209px; font-weight: 800; font-size:15px; margin-bottom: 30px; background-color: #07b4f9; background-image: linear-gradient(to right, #07b4f9, #150fc9); color: white;box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23); clip-path: polygon(0 16%, 100% 0, 100% 100%, 0 100%); border: 1px solid white">Start a New Order</button>\
            </div>\
            <div style="background-image: url({{ site_url }}uploads/email_template/footer_bg.png);height: 100px; text-align: center;">\
                <div style="transform: translate(0,100%);">\
                    <img style="padding-left:13px" src="{{ site_url }}uploads/email_template/facebook.png">\
                    <img style="padding-left: 13px;" src="{{ site_url }}uploads/email_template/instagram.png">\
                </div>\
            </div>\
         </div>\
    </body>';