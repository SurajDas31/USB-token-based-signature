package com.virus.esign.service;

import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfReader;
import com.itextpdf.text.pdf.PdfSignatureAppearance;
import com.itextpdf.text.pdf.PdfStamper;
import com.itextpdf.text.pdf.security.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.security.auth.DestroyFailedException;
import java.io.*;
import java.security.GeneralSecurityException;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
public class SignServiceImpl implements SignService {

    private static final String OS = System.getProperty("os.name").toLowerCase();

    Logger log = LoggerFactory.getLogger(SignServiceImpl.class);

    @Override
    public File getSigned(File file, File resultFile, String pass, String reason, String location, float x, float y, int pageNumber) throws DestroyFailedException {

        PrivateKey pk = null;
        java.security.KeyStore keyStore = null;
        try {
            String pkcs11Config = null;
            if (OS.indexOf("win") >= 0) {
                if (new File("C:\\Windows\\System32\\SignatureP11.dll").exists())       // For SafeScrypt DSC
                    pkcs11Config = "name=eToken\nlibrary=C:\\Windows\\System32\\SignatureP11.dll";
                else if (new File("C:\\Windows\\System32\\eps2003csp11v2.dll").exists())        // For eMudhra DSC
                    pkcs11Config = "name=eToken\nlibrary=C:\\Windows\\System32\\eps2003csp11v2.dll";
                else if (new File("C:\\Windows\\System32\\eps2003csp11.dll").exists())          // For eMudhra DSC
                    pkcs11Config = "name=eToken\nlibrary=C:\\Windows\\System32\\eps2003csp11.dll";

            } else if (OS.indexOf("mac") >= 0) {

            } else if (OS.indexOf("nix") >= 0
                    || OS.indexOf("nux") >= 0
                    || OS.indexOf("aix") > 0) {

            }

            log.info("PKCS11Config: {}", pkcs11Config);
            java.io.ByteArrayInputStream pkcs11ConfigStream = new java.io.ByteArrayInputStream(pkcs11Config.getBytes());
            sun.security.pkcs11.SunPKCS11 providerPKCS11 = new sun.security.pkcs11.SunPKCS11(pkcs11ConfigStream);

            java.security.Security.addProvider(providerPKCS11);

            // Get provider KeyStore and login with PIN

//            keyStore = java.security.KeyStore.getInstance("PKCS11", providerPKCS11);
            keyStore = java.security.KeyStore.getInstance("PKCS11");
            keyStore.load(null, pass.toCharArray());

            // Enumerate items (certificates and private keys) in the KeyStore
            java.util.Enumeration<String> aliases = keyStore.aliases();
            log.info("KeyStore: {}", keyStore.toString());
            String alias = null;
            while (aliases.hasMoreElements()) {
                alias = aliases.nextElement();
                log.info("Alias: {}", alias);
            }

            pk = (PrivateKey) keyStore.getKey(alias, pass.toCharArray());

            Certificate[] chain = keyStore.getCertificateChain(alias);
            OcspClient ocspClient = new OcspClientBouncyCastle();
            TSAClient tsaClient = null;
            for (int i = 0; i < chain.length; i++) {
                X509Certificate cert = (X509Certificate) chain[i];
//                log.info("Certificate Signature: {}", cert.getSignature());
                String tsaUrl = CertificateUtil.getTSAURL(cert);
                if (tsaUrl != null) {
                    tsaClient = new TSAClientBouncyCastle(tsaUrl);
                    break;
                }
            }
            List<CrlClient> crlList = new ArrayList<CrlClient>();
            crlList.add(new CrlClientOnline(chain));
            sign(file, resultFile, chain, pk, DigestAlgorithms.SHA256, providerPKCS11.getName(),
                    MakeSignature.CryptoStandard.CMS, reason, location, x, y, pageNumber, crlList, ocspClient, tsaClient, 0);

            return resultFile;

        } catch (Exception e) {
            log.warn("An error occurred", e);
            e.printStackTrace();
        } finally {
            if (!pk.isDestroyed()) {
//                pk.destroy();
            }

            if (keyStore != null)
                keyStore = null;
        }

        return null;
    }

    public void sign(File src, File dest,
                     Certificate[] chain, PrivateKey pk,
                     String digestAlgorithm, String provider, MakeSignature.CryptoStandard subfilter,
                     String reason, String location, float x, float y, int pageNumber,
                     Collection<CrlClient> crlList,
                     OcspClient ocspClient,
                     TSAClient tsaClient,
                     int estimatedSize)
            throws GeneralSecurityException, IOException, DocumentException {

        // Creating the reader and the stamper
        InputStream is = new FileInputStream(src);
        PdfReader reader = new PdfReader(is);
        
        FileOutputStream os = new FileOutputStream(dest);
        PdfStamper stamper = PdfStamper.createSignature(reader, os, '\0',null, true);

        // Creating the appearance
        PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
        if (reason != null && !reason.isEmpty())
            appearance.setReason(reason);
        if (location != null && !location.isEmpty())
            appearance.setLocation(location);


        Rectangle rectangle = reader.getPageSize(pageNumber);
        float width = rectangle.getWidth();
        float height = rectangle.getHeight();

        y = height - y;

        log.info("Page width: {}", width);
        log.info("Page height: {}", height);
        log.info("x and y coordinate: {} {}", x, y);

        // Full pdf size (1018, 1319)
//        appearance.setVisibleSignature(new Rectangle(350, 200, 500, 300), 1, "sig");
//        appearance.setVisibleSignature(new Rectangle(350, 200, 500, 300), 1, null);
        appearance.setVisibleSignature(new Rectangle(x, y, x + 150, y + 100), pageNumber, null);

        // Creating the signature
        ExternalSignature pks = new PrivateKeySignature(pk, digestAlgorithm, provider);
        ExternalDigest digest = new BouncyCastleDigest();
        MakeSignature.signDetached(appearance, digest, pks, chain, crlList, ocspClient, tsaClient, estimatedSize, subfilter);

    }
}
