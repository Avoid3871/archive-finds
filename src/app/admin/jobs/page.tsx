import { Activity, Clock, CheckCircle2, XCircle } from "lucide-react";

interface JobRecord {
  id: string;
  type: string;
  pieceName: string;
  status: "SUCCESS" | "RUNNING" | "PENDING" | "FAILED";
  attempts: number;
  duration: string;
  timestamp: string;
}

const JOBS_HISTORY: JobRecord[] = [
  {
    id: "job-801",
    type: "GENERATE_IMAGE",
    pieceName: "Helmut Lang Painter Denim",
    status: "SUCCESS",
    attempts: 1,
    duration: "1.2s",
    timestamp: "10 mins ago",
  },
  {
    id: "job-802",
    type: "REMOVE_BACKGROUND",
    pieceName: "Rick Owens Bauhaus Cargo",
    status: "SUCCESS",
    attempts: 1,
    duration: "2.8s",
    timestamp: "14 mins ago",
  },
  {
    id: "job-803",
    type: "CREATE_AFFILIATE",
    pieceName: "Raf Simons Riot Bomber",
    status: "SUCCESS",
    attempts: 1,
    duration: "400ms",
    timestamp: "22 mins ago",
  },
  {
    id: "job-804",
    type: "CHECK_PRODUCT",
    pieceName: "Undercover 85 Denim",
    status: "SUCCESS",
    attempts: 1,
    duration: "850ms",
    timestamp: "30 mins ago",
  },
];

export default function AdminJobsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6">
        <h1 className="text-2xl font-mono font-black uppercase tracking-wider text-white">
          JOB QUEUE & BACKGROUND PIPELINE
        </h1>
        <p className="text-xs font-mono text-neutral-400 mt-1">
          Asynchronous tasks executed by the local Windows worker.
        </p>
      </div>

      {/* Jobs Table */}
      <div className="bg-neutral-900 border border-neutral-800 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
            <tr>
              <th className="py-3 px-4">Job ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Subject Piece</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 text-neutral-300">
            {JOBS_HISTORY.map((job) => (
              <tr key={job.id} className="hover:bg-neutral-800/40">
                <td className="py-3 px-4 text-neutral-400">{job.id}</td>
                <td className="py-3 px-4 font-bold text-white uppercase">{job.type}</td>
                <td className="py-3 px-4">{job.pieceName}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                    {job.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-neutral-400">{job.duration}</td>
                <td className="py-3 px-4 text-neutral-500">{job.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
