import { FeatureGroupDto, UpdateFeaturesDto, featuresDelete, featuresUpdate } from '@/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { QueryNames } from '@/lib/hooks/QueryConstants'
import { useFeatures } from '@/lib/hooks/useFeatures'
import { PermissionProvider } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Checkbox } from '../ui/checkbox'
import { useToast } from '../ui/use-toast'

export type FeatureListProps = {
  onDismiss: () => void
  tenantId: string
}

export const FeatureList = ({ onDismiss, tenantId }: FeatureListProps) => {
  const { data } = useFeatures(PermissionProvider.T, tenantId)
  const queryClient = useQueryClient()
  const [featureValues, setFeatureValues] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const { handleSubmit } = useForm()
  const { toast } = useToast()

  const onCloseEvent = () => {
    setOpen(false)
    onDismiss()
  }

  useEffect(() => {
    setOpen(true)
    const initialValues: Record<string, boolean> = {}
    data?.groups?.forEach((g) => {
      g.features?.forEach((f) => {
        if (f.name) initialValues[f.name] = f.value === 'true'
      })
    })
    setFeatureValues(initialValues)
    return () => {
      queryClient.invalidateQueries({ queryKey: [QueryNames.GetFeatures] }).then()
      queryClient.invalidateQueries({ queryKey: [QueryNames.GetTenants] }).then()
      queryClient.invalidateQueries({ queryKey: [PermissionProvider.T] }).then()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDismiss, data])

  const allFeatures = useMemo(
    () =>
      data?.groups?.flatMap((group) =>
        (group.features ?? []).map((feature) => ({
          ...feature,
          groupName: group.name,
          groupDisplayName: group.displayName,
        })),
      ) ?? [],
    [data],
  )

  const filteredGroups = useMemo(() => {
    const normalized = filter.trim().toLowerCase()
    if (!normalized) return data?.groups ?? []

    return (data?.groups ?? [])
      .map((group) => ({
        ...group,
        features: (group.features ?? []).filter((feature) =>
          [group.displayName, feature.displayName, feature.description, feature.name]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalized)),
        ),
      }))
      .filter((group) => (group.features?.length ?? 0) > 0)
  }, [data, filter])

  const enabledCount = Object.values(featureValues).filter(Boolean).length

  const onSubmit = async () => {
    try {
      const featureUpdateDto = {} as UpdateFeaturesDto
      featureUpdateDto.features = allFeatures
        .filter((feature) => feature.name)
        .map((feature) => ({
          name: feature.name!,
          value: Boolean(featureValues[feature.name!]).toString(),
        }))

      await featuresUpdate({
        body: featureUpdateDto,
        query: { providerKey: PermissionProvider.T, providerName: tenantId },
      })
      toast({
        title: 'Success',
        description: 'Features Update Successfully',
        variant: 'default',
      })
      onCloseEvent()
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({
          title: 'Failed',
          description: 'Feature update failed.',
          variant: 'destructive',
        })
      }
    }
  }

  const onResetToDefaultEvent = async () => {
    try {
      await featuresDelete({
        query: { providerKey: PermissionProvider.T, providerName: tenantId },
      })
      toast({
        title: 'Success',
        description: 'Features has been set to default.',
        variant: 'default',
      })
      onCloseEvent()
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({
          title: 'Failed',
          description: "Features wasn&apos;t able to reset tp default.",
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <section className="p-3">
      <Dialog open={open} onOpenChange={onCloseEvent}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] w-[min(1120px,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Tenant features</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {enabledCount} / {allFeatures.length} features enabled
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b px-6 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Search features..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="hidden overflow-y-auto border-r bg-muted/30 p-4 lg:block">
                <div className="space-y-2">
                  {(data?.groups ?? []).map((group: FeatureGroupDto) => {
                    const count = group.features?.length ?? 0
                    const enabled = group.features?.filter((feature) =>
                      feature.name ? featureValues[feature.name] : false,
                    ).length ?? 0
                    return (
                      <div key={group.name ?? group.displayName} className="rounded-md px-3 py-2 text-sm">
                        <div className="font-medium">{group.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {enabled}/{count} enabled
                        </div>
                      </div>
                    )
                  })}
                </div>
              </aside>

              <div className="max-h-[calc(100vh-15rem)] overflow-y-auto overflow-x-hidden px-6 py-4">
                {filteredGroups.length === 0 && (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No features match your search.
                  </div>
                )}
                <div className="space-y-6">
                  {filteredGroups.map((group: FeatureGroupDto) => (
                    <section key={group.name ?? group.displayName}>
                      <div className="sticky top-0 z-10 -mx-2 bg-background px-2 py-2">
                        <h3 className="text-base font-semibold">{group.displayName}</h3>
                      </div>
                      <div className="grid gap-2">
                        {group.features?.map((feature) => {
                          const name = feature.name ?? ''
                          return (
                            <label
                              key={name || feature.displayName}
                              htmlFor={`${name}_enable`}
                              className="flex cursor-pointer gap-3 rounded-lg border p-3 transition hover:bg-muted/50"
                            >
                              <Checkbox
                                id={`${name}_enable`}
                                name={name}
                                checked={Boolean(featureValues[name])}
                                onCheckedChange={(checked) =>
                                  setFeatureValues((prev) => ({
                                    ...prev,
                                    [name]: checked === true,
                                  }))
                                }
                                className="mt-0.5"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium leading-5">
                                  {feature.displayName}
                                </span>
                                {feature.description && (
                                  <span className="mt-1 block text-xs leading-5 text-muted-foreground break-words">
                                    {feature.description}
                                  </span>
                                )}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={async (e: { preventDefault: () => void }) => {
                  e.preventDefault()
                  await onResetToDefaultEvent()
                }}
              >
                Reset to default
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e: { preventDefault: () => void }) => {
                  e.preventDefault()
                  onCloseEvent()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
