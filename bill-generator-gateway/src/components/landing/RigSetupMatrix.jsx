import React from 'react';
import { 
  Video, 
  Camera, 
  Sliders, 
  Users, 
  Check, 
  Layers, 
  Radio, 
  HardDrive,
  Cpu,
  Tv
} from 'lucide-react';

const RigSetupMatrix = ({ eventBreakdown = {} }) => {
  const twoCamCount = eventBreakdown.twoCameraSetup || 0;
  const threeCamCount = eventBreakdown.threeCameraSetup || 0;
  const otherCount = eventBreakdown.other || 0;

  const rigs = [
    {
      id: 'two-camera',
      title: 'Two-Camera Setup',
      badge: 'STANDARD BROADCAST RIG',
      accentColor: 'indigo',
      deploymentsCount: twoCamCount,
      crewRoster: [
        { role: 'Mixer Operator', count: '1x', desc: 'Real-time multi-angle vision switching & audio leveling' },
        { role: 'Camera Operator #1', count: '1x', desc: 'Primary wide master shot tracking podium/stage' },
        { role: 'Camera Operator #2', count: '1x', desc: 'Close-up tight tracking for speakers & audience reactions' },
        { role: 'Production Assistant', count: '1x', desc: 'Cable management, lapel mic placement & asset logistics' },
      ],
      hardwareSpecs: [
        { label: 'Vision Switching', value: '4-Input HD Broadcast Switcher' },
        { label: 'Audio Matrix', value: '4-Channel Line Mixer + Dual Lapels' },
        { label: 'Recording Output', value: 'Synchronized PGM + Dual ISO Streams' },
        { label: 'Target Venues', value: 'Auditoriums, Conference Halls, Symposia' }
      ]
    },
    {
      id: 'three-camera',
      title: 'Three-Camera Setup',
      badge: 'ENTERPRISE BROADCAST RIG',
      accentColor: 'violet',
      deploymentsCount: threeCamCount,
      crewRoster: [
        { role: 'Mixer Operator', count: '1x', desc: 'Multi-bus video switcher control & live graphics overlay' },
        { role: 'Camera Operator #1', count: '1x', desc: 'Master center wide continuous stage framing' },
        { role: 'Camera Operator #2', count: '1x', desc: 'Stage-left tight tracking on dignitary remarks' },
        { role: 'Camera Operator #3', count: '1x', desc: 'Stage-right roving/profile shot & audience reaction' },
        { role: 'Production Assistant', count: '1x', desc: 'Stage director sync, audio distribution & rig balance' },
      ],
      hardwareSpecs: [
        { label: 'Vision Switching', value: '8-Input Broadcast Console with Multi-View' },
        { label: 'Audio Matrix', value: 'Multi-Track Digital Console + Boundary Mics' },
        { label: 'Video Feeds', value: 'Simultaneous LED Wall PGM + Live Web Stream' },
        { label: 'Target Venues', value: 'ONGC Asset Inaugurations, State Conventions' }
      ]
    }
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-xl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/60">
        <div>
          <div className="inline-flex items-center gap-1.5 text-violet-400 text-xs font-mono font-medium mb-1">
            <Video className="w-3.5 h-3.5" />
            <span>RIG ARCHITECTURE &amp; CREW SPECIFICATIONS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            Multi-Camera Setup Matrix
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Standardized technical configurations engineered for automated role matching and dispute-free tender billing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-mono text-zinc-500 uppercase">Tracked Configurations</p>
            <p className="text-sm font-mono font-bold text-zinc-200">
              {twoCamCount + threeCamCount + otherCount} Rig Deployments
            </p>
          </div>
        </div>
      </div>

      {/* Rigs Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {rigs.map((rig) => (
          <div 
            key={rig.id}
            className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-xl"
          >
            <div>
              {/* Header & Tag */}
              <div className="flex items-center justify-between gap-2 pb-4 border-b border-zinc-800/70">
                <div>
                  <span className="inline-block font-mono text-[10px] uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mb-1.5">
                    {rig.badge}
                  </span>
                  <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-400" />
                    {rig.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-zinc-500">Historical Rigs</span>
                  <p className="font-mono text-lg font-bold text-zinc-200">{rig.deploymentsCount}</p>
                </div>
              </div>

              {/* Crew Roster Breakdown */}
              <div className="mt-5">
                <p className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 mb-3">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Mandatory Personnel Roster ({rig.crewRoster.length} Members)</span>
                </p>

                <div className="space-y-2">
                  {rig.crewRoster.map((member, mIdx) => (
                    <div 
                      key={mIdx}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-mono font-bold text-indigo-400 shrink-0 mt-0.5">{member.count}</span>
                        <div>
                          <p className="font-semibold text-zinc-200">{member.role}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{member.desc}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        Auto-Allocated
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware & Routing Matrix */}
              <div className="mt-5 pt-4 border-t border-zinc-800/70">
                <p className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 mb-3">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Broadcast Hardware Specifications</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rig.hardwareSpecs.map((spec, sIdx) => (
                    <div key={sIdx} className="p-2 rounded bg-zinc-900/40 border border-zinc-800/60 text-xs">
                      <p className="text-[10px] font-mono text-zinc-400 uppercase">{spec.label}</p>
                      <p className="text-xs text-zinc-200 font-medium mt-0.5 truncate">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Guarantee */}
            <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>ONGC Tender Item Compliant</span>
              </span>
              <span className="font-mono text-[11px] text-zinc-400">
                Standard Crew Lock
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Auxiliary Rigs Banner */}
      <div className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-200">
              Auxiliary Coverage &amp; Delivery Media
            </p>
            <p className="text-xs text-zinc-400">
              Single-camera press pools, high-speed 32 GB USB archival media, photography packages, and stage flex banners.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
          <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Automated Work Item Parsing</span>
        </div>
      </div>
    </div>
  );
};

export default RigSetupMatrix;
