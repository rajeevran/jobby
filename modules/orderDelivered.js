module.exports =
    `<body style="padding: 0;margin: 0;font-family: Arial, Helvetica, sans-serif;">
    <div style="width:600px;margin:0 auto;background-image: url({{ site_url }}uploads/email_template/top_bg.png);background-repeat: no-repeat;">
        <div style="text-align: center;"><img style="margin-top: 5%;" src="{{ site_url }}uploads/email_template/logo.png" alt="ezfoodie-logo"></div>
        <div style="margin-top: -13px;margin-bottom: 42px;">
            <div style="margin-top: 8%;">
                <div style="text-align: left; padding: 22px; margin-bottom: 14px;"><span style="display: block;font-weight:700; color: #4f4f4f">ORDER ID: {{ orderId }}</span><span style="font-size:13px;color:#4e4e4e; font-weight: 500;">{{ orderStatus }}</span>
                </div>
            </div>
            <div style="background-color: transparent; padding-left: 49px; padding-right: 49px;">
                <span style="color: #9b9b9b;font-size: 11px;">Issued on behalf of</span>
                <div style="background-color: white; border-radius:5px; height: 99px;">
                    <table>
                        <tr>
                            <td><img src="{{ restaurant_logo }}" alt="food-img" style="width: 103px; border-radius: 18px; padding: 10px;"> </td>
                            <td><p style="display: inherit;font-size: 10px;color: #9a9a9a; font-weight: 600;font-weight: 500;"><span style="display: block; font-weight: 800;font-size: 16px;color:black">{{ restaurant_name }}</span>{{ restaurant_address }}</p></td>
                        </tr>
                    </table>
                </div>
                <div>
                    <ul style="list-style: none;">
                        <div style="color:#4f4f4f; margin-top:9%; font-size: 13px;">
                            {{ order_body }}
                            
                        </div>
                        {{ promocode }}
                    
                        
                        <li style="margin-bottom: 27px; font-weight:700"><span style="display: block; color: #4f4f4f; font-size: 13px;">Taxes</span><span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;">$ {{ transactionFees }}</span></li>
                        
                        <li style="margin-bottom: 27px;color: #9a9a9a; font-size: 10px;"><span style="display: block; color: #4f4f4f; font-size: 13px; font-weight: 700;">Paid</span><span style="float:right;margin-top: -4%;color: #4f4f4f; font-size: 13px;font-weight: 700;">$ {{ total }}</span>Online</li>
                        <li style="color: #9a9a9a;margin-bottom: 20px;font-size: 12px;">Click <a href="{{ invoice_link }}" style="text-decoration: none; font-weight: 600; color:#5a82c3" download>here</a> to download your order summary</li>
                    </ul>
                </div>
                <div style="width:100%"><hr>
                    <div style="text-align: center;">
                        <button style="font-weight:900;border-radius: 5px; font-family: 'Play', sans-serif;border: 0; width: 171px; margin-right: 20px;height: 38px;font-size:16px; background-color: #203b50;color: white;"><span style="display:block; font-size: 10px;font-weight:500;">Download on the</span><img style="float: left;margin-top: -7px;margin-left: 10px;" src="{{ site_url }}uploads/email_template/appleicon.png" alt="apple-icon"><span style="margin-left:-40px">App Store</span>
                        </button>
                        <button style="font-weight:900;border-radius: 5px;font-size:16px;border: 0; width: 171px; height: 38px; background-color: #203b50;color: white;font-family: 'Play', sans-serif;"><span style="font-weight:500;display:block; font-family: 8px;font-size:10px;text-transform: uppercase">Get it on</span><img style="float: left;margin-top: -7px;margin-left: 15px;" src="{{ site_url }}uploads/email_template/playstore.png" alt="apple-icon">Google Play
                        </button>
                    </div>                    
                </div>                          
            </div>
        </div>            
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-image: url({{ site_url }}uploads/email_template/footer_bg.png); height: 100px; text-align: center;">\
            <tbody>\
                <tr>\
                    <td style="text-align: center;">\
                        <img style="padding-left:13px;margin-top: 19px;" src="{{ site_url }}uploads/email_template/facebook.png">\
                        <img style="padding-left: 13px;margin-top: 19px;" src="{{ site_url }}uploads/email_template/instagram.png">\
                    </td>\
                </tr>\
            </tbody>\
        </table>\
    </div>
</body>`;