'use client'

import { useState } from 'react'
import { Info, Book, Code, Tag, Wrench } from 'lucide-react'
import { AISimpleChat } from '@/components/AIChat'

export default function TestRagPage() {
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [context, setContext] = useState<any[]>([])
  const [relevantProject, setRelevantProject] = useState<any>(null)

  // Handle context updates from the AIChat component
  const handleContextUpdate = (contextData: any[], project: any) => {
    setContext(contextData)
    setRelevantProject(project)
  }

  // Sort context by similarity score (highest first)
  const sortedContext = [...(context || [])].sort((a, b) => b.similarity - a.similarity)
  
  // Group context by type
  const generalInfoContext = sortedContext.filter(item => item.content_type === 'general_info')
  const projectContext = sortedContext.filter(item => item.content_type === 'project')
  
  // Check if we have any matching context
  const hasContext = sortedContext && sortedContext.length > 0
  
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">AI Chat with RAG</h1>
      <p className="text-gray-600 mb-6">Ask questions about Jordan's skills, experiences, projects, and more to test the retrieval system.</p>
      
      {/* AIChat Component */}
      <div className="mb-8">
        <AISimpleChat className="w-full" onContextUpdate={handleContextUpdate} />
      </div>
      
      <div className="mb-4 flex items-center gap-2">
        <button 
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="text-sm flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <Info size={16} />
          {showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
      </div>
      
      {showDebugInfo && hasContext && (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Context Used ({sortedContext.length} documents found)
          </h2>
          
          {generalInfoContext.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-1">
                <Book size={16} />
                General Information ({generalInfoContext.length})
              </h3>
              <div className="space-y-3">
                {generalInfoContext.map((item, index) => (
                  <div key={index} className="border rounded p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium uppercase text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.content_type}
                      </span>
                      <span className="text-sm font-medium">
                        Similarity: <span className={`${item.similarity > 0.7 ? 'text-green-600' : item.similarity > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {(item.similarity * 100).toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="mt-2">
                      <h3 className="font-bold">{item.content.title}</h3>
                      <p className="mt-1 text-gray-700">{item.content.content}</p>
                      {item.content.category && (
                        <p className="mt-2 text-sm text-gray-500">Category: {item.content.category}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {projectContext.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center gap-1">
                <Code size={16} />
                Projects ({projectContext.length})
              </h3>
              <div className="space-y-3">
                {projectContext.map((item, index) => (
                  <div key={index} className="border rounded p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium uppercase text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        PROJECT
                      </span>
                      <span className="text-sm font-medium">
                        Similarity: <span className={`${item.similarity > 0.7 ? 'text-green-600' : item.similarity > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {(item.similarity * 100).toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="mt-2">
                      <h3 className="font-bold">{item.content.name}</h3>
                      <p className="mt-1 text-gray-700">{item.content.summary}</p>
                      
                      {item.content.features && item.content.features.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium text-sm">Key Features:</h4>
                          <ul className="list-disc list-inside mt-1 text-sm text-gray-700">
                            {item.content.features.map((feature: string, i: number) => (
                              <li key={i}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {item.content.url && (
                        <div className="mt-2">
                          <a 
                            href={item.content.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                            Project URL
                          </a>
                        </div>
                      )}
                      
                      {item.content.tools && item.content.tools.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                          <Wrench size={14} className="text-gray-500" />
                          {item.content.tools.map((tool: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {item.content.tags && item.content.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 items-center">
                          <Tag size={14} className="text-gray-500" />
                          {item.content.tags.map((tag: string, i: number) => (
                            <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {showDebugInfo && !hasContext && (
        <div className="bg-gray-100 p-4 rounded border">
          <p className="text-gray-700">No context documents were found with sufficient similarity scores.</p>
        </div>
      )}
      
      {relevantProject && (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Highlighted Project</h2>
          <div className="bg-white p-5 rounded-lg shadow-sm border">
            <h3 className="text-xl font-bold">{relevantProject.name}</h3>
            {relevantProject.image_url && (
              <div className="my-4">
                <img 
                  src={relevantProject.image_url} 
                  alt={relevantProject.name} 
                  className="max-w-full h-auto rounded-md"
                />
              </div>
            )}
            <p className="text-gray-700 mt-2">{relevantProject.summary}</p>
            
            {relevantProject.features && relevantProject.features.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-lg">Key Features</h4>
                <ul className="list-disc list-inside mt-2">
                  {relevantProject.features.map((feature: string, i: number) => (
                    <li key={i} className="text-gray-700">{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {relevantProject.url && (
              <a 
                href={relevantProject.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View Project
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 