'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type TestResult = {
  name: string
  status: 'loading' | 'success' | 'error'
  message?: string
}

export default function TestSupabasePage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Connexion Supabase', status: 'loading' },
    { name: 'Table profiles', status: 'loading' },
    { name: 'Table clients', status: 'loading' },
    { name: 'Table contacts', status: 'loading' },
    { name: 'Table projets', status: 'loading' },
    { name: 'Table opportunites', status: 'loading' },
    { name: 'Table taches', status: 'loading' },
  ])

  useEffect(() => {
    async function runTests() {
      const newTests = [...tests]

      // Test 1: Connexion
      try {
        const { data, error } = await supabase.from('profiles').select('count')
        if (error && !error.message.includes('0 rows')) throw error
        newTests[0] = { name: 'Connexion Supabase', status: 'success', message: 'Connecté' }
      } catch (e) {
        newTests[0] = { name: 'Connexion Supabase', status: 'error', message: String(e) }
      }
      setTests([...newTests])

      // Test tables
      const tables = ['profiles', 'clients', 'contacts', 'projets', 'opportunites', 'taches']
      for (let i = 0; i < tables.length; i++) {
        try {
          const { count, error } = await supabase
            .from(tables[i])
            .select('*', { count: 'exact', head: true })

          if (error) throw error
          newTests[i + 1] = {
            name: `Table ${tables[i]}`,
            status: 'success',
            message: `${count || 0} enregistrements`
          }
        } catch (e) {
          newTests[i + 1] = {
            name: `Table ${tables[i]}`,
            status: 'error',
            message: String(e)
          }
        }
        setTests([...newTests])
      }
    }

    runTests()
  }, [])

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Test Connexion Supabase
            <div className="flex gap-2">
              {successCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  {successCount} OK
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} Erreurs
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tests.map((test, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                {test.status === 'loading' && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
                {test.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {test.status === 'error' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">{test.name}</span>
              </div>
              {test.message && (
                <span className={`text-sm ${test.status === 'error' ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {test.message.length > 50 ? test.message.substring(0, 50) + '...' : test.message}
                </span>
              )}
            </div>
          ))}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>URL Supabase:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
