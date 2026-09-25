import { useArchitectureStore } from '../../store/architectureStore';
import type { ArchitectureComponent, ArchitectureConnection, ArchitectureConstraint, ArchitectureDecision } from '@systemarchitect/architecture-schema';

export function GenerationPanel() {
  const {
    currentProjectId,
    engine,
    generateArchitecture,
    generationStatus,
    generationError,
    generationProposal,
  } = useArchitectureStore();

  const handleGenerate = async () => {
    if (!currentProjectId) {
      alert("Please create or load a project first.");
      return;
    }
    
    const requirements = engine.getRequirements();
    if (!requirements || (requirements.functional.length === 0 && (!requirements.constraints || requirements.constraints.length === 0))) {
      alert("Please add some requirements first.");
      return;
    }

    await generateArchitecture(currentProjectId, requirements);
  };

  return (
    <div className="generation-panel bg-white p-4 rounded-lg shadow-md mt-4 border border-gray-200 h-[600px] overflow-y-auto w-full md:w-[400px]">
      <h2 className="text-xl font-bold mb-4">Architecture Generator (Preview)</h2>
      
      <p className="text-sm text-gray-600 mb-4">
        Generate a system architecture proposal based on current requirements.
        This is a <strong>preview only</strong> and will not modify your current architecture.
      </p>

      <button 
        onClick={handleGenerate}
        disabled={generationStatus === 'loading'}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {generationStatus === 'loading' ? 'Generating...' : 'Generate Architecture Preview'}
      </button>

      {generationStatus === 'error' && (
        <div className="text-red-600 text-sm p-3 bg-red-50 rounded mb-4 border border-red-200">
          <strong>Error:</strong> {generationError}
        </div>
      )}

      {generationStatus === 'success' && generationProposal && (
        <div className="proposal-preview space-y-4">
          <div className="p-3 bg-green-50 text-green-800 rounded border border-green-200 text-sm">
            Proposal generated successfully! Review below.
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-800 border-b pb-1">Explanation</h3>
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{generationProposal.explanation}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 border-b pb-1">Components ({generationProposal.components.length})</h3>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
              {generationProposal.components.map((c: ArchitectureComponent) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> ({c.type}) {c.technology ? `- ${c.technology}` : ''}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 border-b pb-1">Connections ({generationProposal.connections.length})</h3>
            <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
              {generationProposal.connections.map((c: ArchitectureConnection) => (
                <li key={c.id}>
                  {c.source} &rarr; {c.target}
                </li>
              ))}
            </ul>
          </div>

          {generationProposal.decisions && generationProposal.decisions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 border-b pb-1">Key Decisions</h3>
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
                {generationProposal.decisions.map((d: ArchitectureDecision) => (
                  <li key={d.id}>
                    <strong>{d.title}:</strong> {d.decision} (Status: {d.status})
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {generationProposal.constraints && generationProposal.constraints.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 border-b pb-1">Constraints Satisfied</h3>
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
                {generationProposal.constraints.map((c: ArchitectureConstraint) => (
                  <li key={c.id}>
                    {c.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
