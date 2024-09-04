//Added by Bane Singh
// Date 21-09-2021
var clientId="9HtWgsKwAgCAkd0cNaDTGPHgh0Q2wMZD";
var clientSecret="QeSJuqF9ZrXOc52N";
var bucketKey = clientId.toLowerCase() +'banetest'+ '_tutorial_bucket'; 
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

var urlencoded = new URLSearchParams();
urlencoded.append("client_id", clientId);
urlencoded.append("client_secret", clientSecret);
urlencoded.append("grant_type", "client_credentials");
urlencoded.append("scope", "data:read data:write data:create bucket:create bucket:read bucket:delete");

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: urlencoded,
};

fetch("https://developer.api.autodesk.com/authentication/v1/authenticate", requestOptions)
  .then(response => response.text())
  .then(function(result) {
       const jsondata = JSON.parse(result);
	    const access_token=jsondata.access_token;
		//deleteBucket(access_token);
		createBucket(access_token);
    }).catch(function(error) {
        console.log("error");
    });
  
  
  
function createBucket(access_token){
var policyKey = 'transient';
var bucketHeader = new Headers();
bucketHeader.append("Content-Type", "application/json");
bucketHeader.append("Authorization", 'Bearer ' + access_token);
data= JSON.stringify({
            'bucketKey': bucketKey,
            'policyKey': policyKey
        });
var bucketOptions = {
  method: 'POST',
  headers: bucketHeader,
  body: data,
};

fetch("https://developer.api.autodesk.com/oss/v2/buckets", bucketOptions)
 .then(function(response) {
    if (!response.ok) {
        throw new Error(response.status);
    }else{
	      return response.text();
	}
    
}).then(function(response) {

            bucketDetail(access_token);
    }).catch(function(error) {
		   var status=error.message;
         if (status == 409) {
               bucketDetail(access_token);
            }
    });
}







function bucketDetail(access_token){

var bucketDetailHeader = new Headers();
bucketDetailHeader.append("Content-Type", "application/json");
bucketDetailHeader.append("Authorization", 'Bearer ' + access_token);

var bucketDetailOptions = {
  method: 'GET',
  headers: bucketDetailHeader
};
var url= 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/details';
fetch(url, bucketDetailOptions)
  .then(response => response.text())
  .then(function(response) {
			  fileUpload(access_token);
    }).catch(function(error) {
                 console.log(error);
    });
}



function fileUpload(access_token){
	
   var binary_string = window.atob(fileContent);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
var filecontent=bytes.buffer;
var filename=fileName;
var filesize=fileSize;

var bucketDetailHeader = new Headers();
bucketDetailHeader.append("Content-Type", "application/json");
bucketDetailHeader.append("Authorization", 'Bearer ' + access_token);
bucketDetailHeader.append("Content-Disposition", filename);
bucketDetailHeader.append("Content-Length", filesize);

var bucketDetailOptions = {
  method: 'PUT',
  headers: bucketDetailHeader,
  body: filecontent
};
var url= 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/objects/' + encodeURIComponent(filename);
fetch(url, bucketDetailOptions)
  .then(response => response.text())
  .then(function(response) {
	   const jsondata = JSON.parse(response);
	    const urn=jsondata.objectId;
		var encodedUrn = btoa(urn);
			   fileViewer(access_token,encodedUrn);
    }).catch(function(error) {
                 console.log(error);
    });
}





function fileViewer(access_token,urn){ 
var bucketDetailHeader = new Headers();
bucketDetailHeader.append("Content-Type", "application/json");
bucketDetailHeader.append("Authorization", 'Bearer ' + access_token);

    var format_type = 'svf';
    var format_views = ['2d', '3d'];
	var data= JSON.stringify({
            'input': {
                'urn': urn
            },
            'output': {
                'formats': [
                    {
                        'type': format_type,
                        'views': format_views
                    }
                ]
            }
        })
var bucketDetailOptions = {
  method: 'POST',
  headers: bucketDetailHeader,
  body: data
};
var url='https://developer.api.autodesk.com/modelderivative/v2/designdata/job';
fetch(url, bucketDetailOptions)
  .then(response => response.text())
  .then(function(response) {
				var viewerurl="viewer.html?urn="+urn;
                parent.isc.Offline.put("bucketKey",bucketKey);
                parent.isc.Offline.put("urn",urn);
				parent.isc.Offline.put("access_token",access_token);
				var firstpathviewer=parent.document.getElementById("autodeskviewer").src.split("index.jsp")[0];
                parent.document.getElementById("autodeskviewer").src=firstpathviewer+viewerurl;

    }).catch(function(error) {
                 console.log(error);
    });
}


function deleteBucket(access_token){
var bucketDetailHeader = new Headers();
bucketDetailHeader.append("Authorization", 'Bearer ' + access_token);
bucketDetailHeader.append("scope", 'bucket:delete');
var bucketDetailOptions = {
  method: 'DELETE',
  headers: bucketDetailHeader
};
var url='https://developer.api.autodesk.com/oss/v2/buckets/'+bucketKey;
fetch(url, bucketDetailOptions)
  .then(response => response.text())
  .then(function(response) {
			  console.log(response);
    }).catch(function(error) {
        console.log(error);
    });
	
}

