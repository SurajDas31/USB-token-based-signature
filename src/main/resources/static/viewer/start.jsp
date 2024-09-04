<%@ page import="javax.servlet.*" %>
<%@ page import="javax.servlet.http.*" %>
<%@ page import="java.util.regex.*" %>
<%@ page import="com.docedge.core.security.*" %>
<%@ page import="com.docedge.core.store.*" %>
<%@ page import="com.docedge.core.document.*" %>
<%@page import="com.docedge.core.document.dao.*" %>
<%@ page import="com.docedge.util.*" %>
<%@ page import="java.util.*" %>

<%
    if (!SessionManager.getInstance().isValid(request.getParameter("sid")))
        throw new Exception("Session expired");

    UserSession ldSession = SessionManager.getInstance().get(request.getParameter("sid"));
    Storer storer = (Storer) Context.getInstance().getBean(Storer.class);
    DocumentDAO docDao = (DocumentDAO) Context.getInstance().getBean(DocumentDAO.class);
    Long docId = Long.parseLong(request.getParameter("docId"));
    Document doc = docDao.findById(docId);
    if (doc.getDocRef() != null) {
        doc = docDao.findById(doc.getDocRef());
    }
    Long userId = ldSession.getUserId();
    String npr = request.getParameter("unicode");
    String userName = ldSession.getUserName();
    com.docedge.core.security.SecurityManager security = (com.docedge.core.security.SecurityManager) Context.getInstance().getBean(com.docedge.core.security.SecurityManager.class);
    String name = request.getParameter("unicode");

    if (name == null) {
        if (!security.isReadEnabled(docId, userId))
            throw new Exception("Permission Denied");
    }

    boolean download = security.isDownloadEnabled(docId, userId);
    String fileVersion = String.valueOf(request.getParameter("fileVersion"));
    String resourceName = storer.getResourceName(doc, fileVersion, null);
    byte[] bytes = storer.getBytes(doc.getId(), resourceName);
    int fileSize = bytes.length;
    String fileName = doc.getFileName();
    String fileContent = Base64.getEncoder().encodeToString(bytes);

    String path = "convertpdf";
    if (request.getParameter("path") != null)
        path = request.getParameter("path");
%>


<!DOCTYPE html>
<html>
<title>Document Management System</title>
<head>
    <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=no"/>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css?family=Montserrat" rel="stylesheet"/>
    <style>
        body {
            font-family: sans-serif;
        }

        .container {
            margin: 30% auto;
            height: 200px;
            width: 60%;
            position: relative;
            border: 3px solid #cfcfcf;
            border-radius: 12px;
        }

        .vertical-center {
            margin: 0;
            position: relative;
            top: 40%;
            -ms-transform: translateY(-50%);
            transform: translateY(-50%);
            text-align: center;
        }


        .btn {
            align-items: center;
            background-color: #1a9cd7;
            border: 2px solid #1a9cd7;
            box-sizing: border-box;
            color: #fff;
            cursor: pointer;
            display: inline-flex;
            fill: #000;
            font-family: Inter, sans-serif;
            font-size: 16px;
            font-weight: 600;
            height: 48px;
            justify-content: center;
            letter-spacing: -.8px;
            line-height: 24px;
            min-width: 140px;
            outline: 0;
            padding: 0 17px;
            text-align: center;
            text-decoration: none;
            transition: all .3s;
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
        }

        .btn:focus {
            color: #171e29;
        }

        .btn:hover {
            background-color: #7986cb;
            border-color: #7986cb;
            fill: #1a9cd7;
        }

        .btn:active {
            background-color: #7986cb;
            border-color: #7986cb;
            fill: #1a9cd7;
        }

        @media (min-width: 768px) {
            .btn {
                min-width: 170px;
            }
        }
    </style>
    <script>

        var sid = '<%=request.getParameter("sid")%>';
        var docId = '<%=docId%>';
        var fileName = '<%=fileName%>';
        var fileVersion = '<%=fileVersion%>';


        function openPreview() {
            parent.openAutoDeskPreview(sid, docId, fileName, fileVersion);
        }

    </script>

</head>
<body>


<div class="container">
    <div class="vertical-center">
        <p>File can't be preview here. Please click on the below button to open a 3D viewer</p>
        <button class="btn" onclick="openPreview()">Open Previewer</button>
    </div>
</div>


</body>
</html>