import { getPreferenceValues as getPreferenceValues_ } from '@raycast/api'
import { Preferences } from '../types'

export const getPreferenceValues = () => getPreferenceValues_<Preferences>()
