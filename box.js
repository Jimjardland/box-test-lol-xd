const fs = require('fs')
const path = require('path')
const BoxSDK = require('box-node-sdk')

const config = JSON.parse(fs.readFileSync('box.json'))

const sdk = BoxSDK.getPreconfiguredInstance(config)

const client = sdk.getAppAuthClient('enterprise')

const filePath = path.join(__dirname, 'coolness_agreement.pdf')
const fileName = path.basename(filePath)
const parentId = '0'

async function uploadFile(client, parentId, fileName, filePath) {
  const file = await client.files.uploadFile(
    parentId,
    fileName,
    fs.createReadStream(filePath)
  )
  console.log(`Uploaded File "${fileName}" ${file.entries[0].id}`)
  return file.entries[0].id
}

async function shareFile(client, fileId) {
  const sharedFile = await client.files.update(fileId, {
    shared_link: {
      access: 'open',
    },
  })
  console.log(`Shared Link "${sharedFile.shared_link.url}"`)
  return sharedFile
}

async function tagFile(client, fileId, tags) {
  const updatedFile = await client.files.update(fileId, { tags })
  return updatedFile
}

async function getTags(client, fileId) {
  const file = await client.files.get(fileId, { fields: 'tags' })
  console.log(`Current tags for File "${fileId}": ${file.tags}`)
  return file.tags
}

async function addComment(client, fileId, message) {
  const comment = await client.comments.create(fileId, message)
  console.log(`Added comment: "${message}"`)
  return comment
}

async function getComments(client, fileId) {
  const comments = await client.files.getComments(fileId)

  comments.entries.map((comment, i) => {
    console.log(`${i + 1} comment on document: ${comment.message}`)
  })
  return comments
}

async function createFolder(parentId, name) {
  try {
    const folder = await client.folders.create(parentId, name)
    console.log(`Created Folder "${name}" ${folder.id}`)
    return folder
  } catch (err) {
    console.error(err)
  }
}

async function requestSignature(client, fileId, email, folderId) {
  const request = await client.signRequests.create({
    signers: [
      {
        role: 'signer',
        email: email,
      },
    ],
    source_files: [
      {
        type: 'file',
        id: fileId,
      },
    ],
    parent_folder: {
      type: 'folder',
      id: folderId || '0',
    },
  })

  console.log(`Created Signature Request ${request.id}`)

  return request
}

;(async () => {
  try {
    const { id: folderId } = await createFolder(0, 'Abba')
    const fileId = await uploadFile(client, folderId, fileName, filePath)
    await shareFile(client, fileId)
    await tagFile(client, fileId, ['cool', 'nocco'])
    await getTags(client, fileId)
    await addComment(client, fileId, 'Comment from Abba')
    await getComments(client, fileId)
    await requestSignature(
      client,
      fileId,
      'jimmy.jardland@crowdhouse.ch',
      folderId
    )
  } catch (err) {
    console.error(err)
  }
})()
