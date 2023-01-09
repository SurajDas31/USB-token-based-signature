import com.itextpdf.signatures.CertificateUtil;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.security.*;

import java.io.FileOutputStream;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class USBSignature {
    public static void main(String args[]) throws IOException, GeneralSecurityException, DocumentException {
        // Create instance of SunPKCS11 provider

        String userFile = "C:\\Users\\Suraj\\Documents\\VPN_Config_Guide.pdf";
        String userFile_signed = "C:\\Users\\Suraj\\Documents\\VPN_Config_Guide-Signed.pdf";

        String pkcs11Config = "name=eToken\nlibrary=C:\\Windows\\System32\\eps2003csp11v2.dll";
        java.io.ByteArrayInputStream pkcs11ConfigStream = new java.io.ByteArrayInputStream(pkcs11Config.getBytes());
        sun.security.pkcs11.SunPKCS11 providerPKCS11 = new sun.security.pkcs11.SunPKCS11(pkcs11ConfigStream);
        java.security.Security.addProvider(providerPKCS11);

        // Get provider KeyStore and login with PIN
        String pin = "12345678";
        java.security.KeyStore keyStore = java.security.KeyStore.getInstance("PKCS11", providerPKCS11);
        keyStore.load(null, pin.toCharArray());

        // Enumerate items (certificates and private keys) in the KeyStore
        java.util.Enumeration<String> aliases = keyStore.aliases();
        String alias = null;
        while (aliases.hasMoreElements()) {
            alias = aliases.nextElement();
            System.out.println(alias);
        }

        PrivateKey pk = (PrivateKey) keyStore.getKey(alias, pin.toCharArray());
        Certificate[] chain = keyStore.getCertificateChain(alias);
        OcspClient ocspClient = new OcspClientBouncyCastle();
        TSAClient tsaClient = null;
        for (int i = 0; i < chain.length; i++) {
            X509Certificate cert = (X509Certificate) chain[i];
            System.out.println(cert.getSignature());
            String tsaUrl = CertificateUtil.getTSAURL(cert);
            if (tsaUrl != null) {
                tsaClient = new TSAClientBouncyCastle(tsaUrl);
                break;
            }
        }
        List<CrlClient> crlList = new ArrayList<CrlClient>();
        crlList.add(new CrlClientOnline(chain));

        new USBSignature().sign(userFile, userFile_signed, chain, pk, DigestAlgorithms.SHA256, providerPKCS11.getName(),
                MakeSignature.CryptoStandard.CMS, "", "", crlList, ocspClient, tsaClient, 0);
    }

    public void sign(String src, String dest,
                     Certificate[] chain, PrivateKey pk,
                     String digestAlgorithm, String provider, MakeSignature.CryptoStandard subfilter,
                     String reason, String location,
                     Collection<CrlClient> crlList,
                     OcspClient ocspClient,
                     TSAClient tsaClient,
                     int estimatedSize)
            throws GeneralSecurityException, IOException, DocumentException {
        // Creating the reader and the stamper
        PdfReader reader = new PdfReader(src);
        FileOutputStream os = new FileOutputStream(dest);
        PdfStamper stamper = PdfStamper.createSignature(reader, os, '\0');
        // Creating the appearance
        PdfSignatureAppearance appearance = stamper.getSignatureAppearance();
        if (reason != null && !reason.isEmpty())
            appearance.setReason(reason);

        if (location != null && !location.isEmpty())
            appearance.setLocation(location);
        appearance.setVisibleSignature(new Rectangle(350, 200, 500, 300), 1, "sig");
        // Creating the signature
        ExternalSignature pks = new PrivateKeySignature(pk, digestAlgorithm, provider);
        ExternalDigest digest = new BouncyCastleDigest();
        MakeSignature.signDetached(appearance, digest, pks, chain, crlList, ocspClient, tsaClient, estimatedSize, subfilter);
    }
}
