 <%@ page import="javax.servlet.*" %>
<%@ page import="javax.servlet.http.*" %>
<%@ page import="java.util.regex.*" %>
<%@ page import="com.docedge.core.security.*" %>
<%@ page import="com.docedge.core.store.*"%>
<%@ page import="com.docedge.core.document.*"%>
<%@page import="com.docedge.core.document.dao.*"%>
<%@ page import="com.docedge.util.*" %>
<%@ page import="java.util.*"%>
<%
  if(!SessionManager.getInstance().isValid(request.getParameter("sid")))
	  throw new Exception("Session expired");
    
  UserSession ldSession = SessionManager.getInstance().get(request.getParameter("sid"));    
  Storer storer = (Storer) Context.getInstance().getBean(Storer.class);  
  DocumentDAO docDao = (DocumentDAO) Context.getInstance().getBean(DocumentDAO.class);
  Long docId = Long.parseLong(request.getParameter("docId"));
  Document doc = docDao.findById(docId);
  if (doc.getDocRef() != null){
				doc = docDao.findById(doc.getDocRef());
  }  
  Long userId = ldSession.getUserId();
  String npr = request.getParameter("unicode");
  String userName = ldSession.getUserName();
  com.docedge.core.security.SecurityManager security = (com.docedge.core.security.SecurityManager)Context.getInstance().getBean(com.docedge.core.security.SecurityManager.class);  
  String name = request.getParameter("unicode"); 

  if(name==null){
	  if(!security.isReadEnabled(docId, userId))
		  throw new Exception("Permission Denied");
  }
  
  boolean download = security.isDownloadEnabled(docId, userId);
  String fileVersion=String.valueOf(request.getParameter("fileVersion"));
  String resourceName = storer.getResourceName(doc,fileVersion, null);
  byte[] bytes= storer.getBytes(doc.getId(), resourceName);
  int fileSize=bytes.length;
  String fileName=doc.getFileName();
  String fileContent = Base64.getEncoder().encodeToString(bytes);
  
  String path = "convertpdf";
  if(request.getParameter("path")!=null)
  	path = request.getParameter("path");
%>
<!DOCTYPE html>
<html>
  <title>Document Management System</title>
<head>
    <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=no" />
    <meta charset="utf-8">

    <link rel="stylesheet" href="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css" type="text/css">
    <script src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js"></script>
       <script src="start.js"></script>
    <style>
        body {
            margin: 0;
        }
        #forgeViewer {
            width: 100%;
            height: 100%;
            margin: 0;
            background-color: #F0F8FF;
        }
    </style>
	<script>
	     var fileName = '<%=fileName%>';
		 var fileSize = '<%=fileSize%>';
		 var fileContent = '<%=fileContent%>';

	</script>
	
</head>
<body>

    <div id="forgeViewer"></div>
  
</body>
</html>