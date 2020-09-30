var termAndConditionSchema= require('../schema/term_and_condition');
var faqSchema= require('../schema/faq');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config');
var async = require("async");
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var jwt = require('jsonwebtoken');
var secretKey = config.secretKey;
var mailProperty = require('../modules/sendMail');



var anotherAdminModel =
{
    addTermAndCondition:async function(data,callback)
    {
        if(data){
            termAndConditionSchema
            .findOne({
                         title : data.title
                     },
                function (err, result) 
                {
                    if(result !== null )
                    {
                        callback({
                            "response_code"     : 2008,
                            "response_message"  : "Title already exists",
                            "response_data"     : {}
                           });
                    }
                    else
                    {
                        var termCondition = new termAndConditionSchema
                        ({
                            "_id"                    :  new ObjectID(),
                            "title"                  :  data.title,
                            "ar_title"               :  data.ar_title,
                            "description"            :  data.description,
                            "ar_description"         :  data.ar_description,
                            "content_type"           :  data.content_type

                        });
                        termCondition.save(function(err2,res2)
                        {
                            if(err2){
                                        callback({
                                        "response_code"     : 5005,
                                        "response_message"  : "INTERNAL DB ERROR",
                                        "response_data"     : {}
                                        });
                            }else{
                                    callback({
                                        "response_code"   : 2000,
                                        "response_message": "Term and condition  add successfully."
                                    });
                            
                            }

                        });
                    }

                });
        }
        
    },

    listTermAndCondition:async function (data, callback) {
      
    
        if (data._id) 
        {
          obj   = { "_id": data._id }
        } 
        else if(data.content_type) 
        {
          obj   = { "content_type": data.content_type }
        } 
        else 
        {
          obj   = {}
        }
    
        termAndConditionSchema.find(obj, function (err, result) {
    
          if (err) {
                    callback({
                    "success"       :   false,
                    "STATUSCODE"    :   5005,
                    "message"       :   "INTERNAL DB ERROR",
                    "response_data" :   err
                    })
    
          } else {
                    callback({
                    "success"       :   true,
                    "response_code" :   2000,
                    "message"       :   "Term and condition list ",
                    "response_data" :   result
                    })
          }
    
    
        })
      },


      updateTermAndCondition: function (data,callback) {

        if(data)
        {

            termAndConditionSchema
              .update({ _id: data._id },
                    {
                        $set: {
                            "title"                  :  data.title,
                            "ar_title"               :  data.ar_title,
                            "description"            :  data.description,
                            "ar_description"         :  data.ar_description
                        }
                    },
                function (err, result) {
                  if (result) {

                    callback({
                      "success"         :   true,
                      "response_code"   :   2000,
                      "response_message":   "CMS updated Successfully",
                    })
                  } else {

                    callback({
                      "success"             :   false,
                      "response_message"    :   "INTERNAL DB ERROR",
                      "response_code"       :   5005,
                      "response_data"       :   err
                    })
                  }

                });
        }

      
    
      },
    
      addFaq:async function(data,callback)
      {
        //   console.log("===========================data",data);
          
          if(data){
            var query = faqSchema
                        .findOne({
                                    question   : { $regex : data.question , $options : 'i' },
                                    user_type  : data.user_type
                                });

            query.select('');

            query.exec(function (err, result) 
            {

                      if(result !== null)
                      {
                          callback({
                              "response_code"     : 2008,
                              "response_message"  : "question already exists",
                              "response_data"     : {}
                             });
                      }
                      else
                      {
                          var faqData = new faqSchema
                          ({
                              "_id"            :    new ObjectID(),
                              "user_type"      :    data.user_type,
                              "question"       :    data.question,
                              "ar_question"    :    data.ar_question,
                              "answer"         :    data.answer,
                              "ar_answer"      :    data.ar_answer

                          });
                          faqData.save(function(err2,res2)
                          {
                              if(err2){
                                          callback({
                                          "response_code"   : 5005,
                                          "response_message": "INTERNAL DB ERROR",
                                          "response_data"   : {}
                                          });
                              }else{
                                      callback({
                                          "response_code"   : 2000,
                                          "response_message": "Faq add successfully."
                                      });
                              
                              }
  
                          });
                      }
                      
  
                  });
          }
          
      },


      listFaq:async function (data, callback) {

                var  page   = 1,
                     limit  = 10,
                     query  = {};
                
                if(data.page){
                    page = parseInt(data.page);
                }

                if(data.limit){
                    limit=parseInt(data.limit);
                }

                if (data._id) {
                        query   = { '_id': data._id }
                } 
                else if(data.user_type){
                        query   = {'user_type':data.user_type}
                }

                var aggregate = faqSchema.aggregate();

                aggregate.match(query);

                aggregate.project({
                                        _id          :   1,
                                        question     :   1,
                                        answer       :   1,
                                        ar_question  :   1,
                                        ar_answer    :   1,
                                        user_type    :   1

                });

                aggregate.sort({'createdAt': 1});

                var options={
                                page   : page,
                                limit  : limit
                 }

                 faqSchema.aggregatePaginate(aggregate,options,function(err,results,pageCount,count){
                    if (err) {
                        callback({
                            "response_code": 5005,
                            "response_message": err,
                            "response_data": {}
                        });
        
                    } else {
        
                        var data = {
                            docs: results,
                            pages: pageCount,
                            total: count,
                            limit: limit,
                            page: page
                        }
                        callback({
                            "response_code": 2000,
                            "response_message": "faq  list.",
                            "response_data": data
                        });
        
                    }

                 });

                
      },

      sendMail:async function (data, callback) {

        return new Promise((resolve, reject) => {
            try{

       // mailProperty('newResumeMail')(employee.email, {
                        //     name: employee.fname + ' ' + employee.lname,
                        //     resumeTitle: createResume.title,
                        //     site_url: config.liveUrl,
                        //     date: new Date()
                        // }).send();
             mailProperty('newResumeMail')(data.email, {
                                            name: data.email,
                                            resumeTitle: data.resumeTitle,
                                            site_url: config.liveUrl,
                                            date: new Date()
                                        }).send();
    
                    resolve(true)
                    
                    callback({
                        "response_code": 2000,
                        "response_message": "mail send  ",
                        "response_data": {}
                    });

            }catch( e){
                reject(e)
                
                callback({
                    "response_code": 2000,
                    "response_message": "mail send failed ",
                    "response_data": e
                });
            }
    
            // mailProperty('sendOrderPDF')('rajeevranjan.brainium@gmail.com', {
            //     name: 'surojitpaul',
            //     email: 'rajeevranjan.brainium@gmail.com',
            // }).send();
        });
      },

      updateFaq: function (data,callback) {

        if(data)
        {

            faqSchema
              .updateOne({ _id: data._id },
                    {
                    $set: {
                            "user_type"      :    data.user_type,
                            "question"       :    data.question,
                            "ar_question"    :    data.ar_question,
                            "answer"         :    data.answer,
                            "ar_answer"      :    data.ar_answer
                          }
                    },
                function (err, result) {
                  if (result) {

                    callback({
                      "success"            :   true,
                      "response_code"      :   2000,
                      "response_message"   :   "Faq updated Successfully",
                    })
                  } else {

                    callback({
                      "success"             :   false,
                      "response_message"    :   "INTERNAL DB ERROR",
                      "response_code"       :   5005,
                      "response_data"       :   err
                    })
                  }

                });
        }

      
    
      },


      deleteFaq: function (data,callback) {

        if(data)
        {

            faqSchema.deleteOne({ _id: data._id },
                function (err, result) {

                  if (result) {

                    callback({
                      "success"            :   true,
                      "response_code"      :   2000,
                      "response_message"   :   "Faq Deleted Successfully",
                    })
                  } else {

                    callback({
                      "success"             :   false,
                      "response_message"    :   "INTERNAL DB ERROR",
                      "response_code"       :   5005,
                      "response_data"       :   err
                    })
                  }

                });
        }

      
    
      },




}

module.exports = anotherAdminModel;
