'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TiptapReadOnly } from '@/components/editors/TiptapReadOnly';
import { Loader2, Search, ImageIcon, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StrategyDetail {
  content: string;
  images: string[];
  notes: string;
}

interface SopType {
  id: string;
  name: string;
  description: string;
  detailContentShort: string | null;
  detailContentLong: string | null;
  detailEnabledShort: boolean;
  detailEnabledLong: boolean;
  detailUpdatedAt: string | null;
  sortOrder: number;
}

export default function StrategiesPage() {
  const [sopTypes, setSopTypes] = useState<SopType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sop-types/with-details');
      const data = await response.json();

      if (data.success) {
        setSopTypes(data.data);
      } else {
        toast.error('Failed to load strategies');
      }
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast.error('Failed to load strategies');
    } finally {
      setIsLoading(false);
    }
  };

  const parseDetailContent = (content: string | null): StrategyDetail => {
    if (!content) {
      return { content: '', images: [], notes: '' };
    }

    try {
      const parsed = JSON.parse(content);
      if (parsed.content !== undefined) {
        return {
          content: parsed.content || '',
          images: parsed.images || [],
          notes: parsed.notes || '',
        };
      } else {
        // Legacy format - plain text
        return { content, images: [], notes: '' };
      }
    } catch {
      // Parsing failed, treat as plain text
      return { content, images: [], notes: '' };
    }
  };

  const filteredSopTypes = sopTypes.filter((sop) => {
    const query = searchQuery.toLowerCase();
    return (
      sop.name.toLowerCase().includes(query) ||
      sop.description?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Trading Strategies</h1>
        <p className="text-muted-foreground">
          Reference guide for SOP-compliant entry strategies
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search strategies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* No Results */}
      {filteredSopTypes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchQuery ? (
              <>No strategies found matching &quot;{searchQuery}&quot;</>
            ) : (
              <>No strategies available yet. Check back later!</>
            )}
          </CardContent>
        </Card>
      )}

      {/* Strategies Accordion */}
      {filteredSopTypes.length > 0 && (
        <Accordion type="single" collapsible className="space-y-4">
          {filteredSopTypes.map((sop) => {
            const shortDetail = sop.detailEnabledShort
              ? parseDetailContent(sop.detailContentShort)
              : null;
            const longDetail = sop.detailEnabledLong
              ? parseDetailContent(sop.detailContentLong)
              : null;

            return (
              <AccordionItem key={sop.id} value={sop.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full pr-4 gap-2">
                    <span className="font-semibold text-base sm:text-lg text-left">{sop.name}</span>
                    <div className="flex gap-2 flex-wrap">
                      {sop.detailEnabledShort && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          📉 Short
                        </Badge>
                      )}
                      {sop.detailEnabledLong && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          📈 Long
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    {/* Description */}
                    {sop.description && (
                      <p className="text-sm text-muted-foreground">{sop.description}</p>
                    )}

                    {/* SHORT Strategy */}
                    {shortDetail && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-blue-700">📉 Short Entry Strategy</h3>
                          <span className="text-xs text-muted-foreground">(Bearish / Sell)</span>
                        </div>
                        <Card className="bg-blue-50/50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="grid md:grid-cols-[300px_1fr] gap-4">
                              {/* Left Column: Visual Content */}
                              {(shortDetail.images.length > 0 || shortDetail.notes) && (
                                <div className="space-y-3">
                                  {/* Images */}
                                  {shortDetail.images.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                        <ImageIcon className="h-4 w-4" />
                                        Chart Examples
                                      </div>
                                      <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                                        {shortDetail.images.map((img, idx) => (
                                          <img
                                            key={idx}
                                            src={img}
                                            alt={`Chart ${idx + 1}`}
                                            className="w-full rounded border border-blue-200 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                              // Full-screen view
                                              const modal = document.createElement('div');
                                              modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer';
                                              modal.onclick = () => modal.remove();
                                              
                                              const fullImg = document.createElement('img');
                                              fullImg.src = img;
                                              fullImg.alt = `Chart ${idx + 1}`;
                                              fullImg.className = 'max-w-[90vw] max-h-[90vh] object-contain';
                                              
                                              modal.appendChild(fullImg);
                                              document.body.appendChild(modal);
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Chart Notes */}
                                  {shortDetail.notes && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                        <FileText className="h-4 w-4" />
                                        Chart Notes
                                      </div>
                                      <div className="text-xs sm:text-sm bg-white/50 p-3 rounded border border-blue-200 whitespace-pre-wrap">
                                        {shortDetail.notes}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Right Column: Strategy Details */}
                              <div className="space-y-2">
                                <div className="text-xs sm:text-sm font-medium">Strategy Details</div>
                                {shortDetail.content ? (
                                  <div className="bg-white/50 p-3 sm:p-4 rounded border border-blue-200">
                                    <TiptapReadOnly content={shortDetail.content} />
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground italic">
                                    No strategy details provided yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* LONG Strategy */}
                    {longDetail && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h3 className="text-base sm:text-lg font-semibold text-purple-700">📈 Long Entry Strategy</h3>
                          <span className="text-xs text-muted-foreground">(Bullish / Buy)</span>
                        </div>
                        <Card className="bg-purple-50/50 border-purple-200">
                          <CardContent className="p-4">
                            <div className="grid md:grid-cols-[300px_1fr] gap-4">
                              {/* Left Column: Visual Content */}
                              {(longDetail.images.length > 0 || longDetail.notes) && (
                                <div className="space-y-3">
                                  {/* Images */}
                                  {longDetail.images.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                        <ImageIcon className="h-4 w-4" />
                                        Chart Examples
                                      </div>
                                      <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                                        {longDetail.images.map((img, idx) => (
                                          <img
                                            key={idx}
                                            src={img}
                                            alt={`Chart ${idx + 1}`}
                                            className="w-full rounded border border-purple-200 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                              // Full-screen view
                                              const modal = document.createElement('div');
                                              modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer';
                                              modal.onclick = () => modal.remove();
                                              
                                              const fullImg = document.createElement('img');
                                              fullImg.src = img;
                                              fullImg.alt = `Chart ${idx + 1}`;
                                              fullImg.className = 'max-w-[90vw] max-h-[90vh] object-contain';
                                              
                                              modal.appendChild(fullImg);
                                              document.body.appendChild(modal);
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Chart Notes */}
                                  {longDetail.notes && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                                        <FileText className="h-4 w-4" />
                                        Chart Notes
                                      </div>
                                      <div className="text-xs sm:text-sm bg-white/50 p-3 rounded border border-purple-200 whitespace-pre-wrap">
                                        {longDetail.notes}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Right Column: Strategy Details */}
                              <div className="space-y-2">
                                <div className="text-xs sm:text-sm font-medium">Strategy Details</div>
                                {longDetail.content ? (
                                  <div className="bg-white/50 p-3 sm:p-4 rounded border border-purple-200">
                                    <TiptapReadOnly content={longDetail.content} />
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground italic">
                                    No strategy details provided yet.
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Last Updated */}
                    {sop.detailUpdatedAt && (
                      <p className="text-xs text-muted-foreground text-right">
                        Last updated: {new Date(sop.detailUpdatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
