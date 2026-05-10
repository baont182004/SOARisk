import { PageIntro } from '../../components/page-intro';
import { PcapDemoPanel } from '../../components/pcap-demo-panel';

export default function PcapIntakePage() {
  return (
    <>
      <PageIntro
        title="Upload PCAP"
        role="PCAP Intake"
        description="Upload PCAP/PCAPNG files to generate test security alerts and trigger the SOAR response pipeline."
      />
      <PcapDemoPanel />
    </>
  );
}
