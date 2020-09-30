module.exports = new(function () {
  this.updateDate = function (updateDate) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let today = new Date(),
      month = months[new Date(updateDate).getMonth()],
      date = new Date(updateDate).getDate(),
      updateTimestamp = new Date(updateDate).getTime(),
      timeDiff = updateTimestamp - Date.now(),
      diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
    diffYears = new Date().getFullYear() - new Date(updateDate).getFullYear();

    if (diffYears === 0 && diffDays === 0) {
      return "Today";
    } else if (diffYears === 0 && diffDays === -1) {
      return "1 day ago";
    } else if (diffYears === 0 && (diffDays < -1 && diffDays >= -7)) { // upto 7 days
      return Math.abs(diffDays) + " days ago";
    } else { // above 7 days
      return month + " " + date + ", " + new Date(updateDate).getFullYear();
    }

  };
  this.employerProfileCompleted = function (employer) {

    var profile_image = null;

    if (employer.profile_image_updated == true) {
      profile_image = employer.profile_image
    } else {
      profile_image = employer.socialLogin.image;
    }

    var pecentage = 0;

    if (employer.fname != '') {
      pecentage = 12.5;
    }
    if (employer.lname != '') {
      pecentage = pecentage + 12.5;
    }
    if (employer.email != '') {
      pecentage = pecentage + 12.5;
    }
    if (employer.phone_no != '') {
      pecentage = pecentage + 12.5;
    }
    if (employer.email_verify == 'yes') {
      pecentage = pecentage + 12.5;
    }
    if (employer.companyId != null) {
      pecentage = pecentage + 12.5;
    }
    if (employer.jobCount > 0) {
      pecentage = pecentage + 12.5;
    }

    if (profile_image !== null) {
      pecentage = pecentage + 12.5;
    }
    return pecentage;
  };

})();